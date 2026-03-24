import os
from typing import Literal

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import async_session, get_db
from models import BillingWebhookEvent, User, Workspace

router = APIRouter(prefix="/api/billing", tags=["billing"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
STRIPE_SUCCESS_URL = os.getenv("STRIPE_SUCCESS_URL", "http://localhost:5173/enterprise-settings?billing=success")
STRIPE_CANCEL_URL = os.getenv("STRIPE_CANCEL_URL", "http://localhost:5173/enterprise-settings?billing=cancel")

PRICE_LOOKUP = {
    "Seed": os.getenv("STRIPE_PRICE_SEED", "").strip(),
    "Growth": os.getenv("STRIPE_PRICE_GROWTH", "").strip(),
    "Enterprise": os.getenv("STRIPE_PRICE_ENTERPRISE", "").strip(),
}


class CheckoutRequest(BaseModel):
    plan_tier: Literal["Seed", "Growth", "Enterprise"]


def _stripe_status_to_internal(status: str) -> str:
    if status in {"active", "trialing"}:
        return "active"
    if status in {"past_due", "unpaid", "incomplete", "incomplete_expired"}:
        return "past_due"
    return "canceled"


@router.post("/create-checkout-session")
async def create_checkout_session(
    payload: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe key not configured")

    price_id = PRICE_LOOKUP.get(payload.plan_tier, "")
    if not price_id:
        raise HTTPException(status_code=400, detail=f"Missing Stripe price for {payload.plan_tier}")

    if not current_user.workspace_id:
        raise HTTPException(status_code=400, detail="User has no workspace")

    workspace = (
        await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
    ).scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    customer_id = workspace.stripe_customer_id
    if not customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.full_name,
            metadata={"workspace_id": workspace.id},
        )
        customer_id = customer.id
        workspace.stripe_customer_id = customer_id
        await db.flush()

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=STRIPE_SUCCESS_URL,
        cancel_url=STRIPE_CANCEL_URL,
        metadata={"workspace_id": workspace.id, "plan_tier": payload.plan_tier},
    )
    return {"checkout_url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Stripe webhook secret not configured")
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=STRIPE_WEBHOOK_SECRET,
        )
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc

    event_id = event.get("id", "")
    async with async_session() as session:
        if event_id:
            existing = (
                await session.execute(select(BillingWebhookEvent).where(BillingWebhookEvent.id == event_id))
            ).scalar_one_or_none()
            if existing:
                return {"received": True, "duplicate": True}
            session.add(BillingWebhookEvent(id=event_id, event_type=event["type"]))
            await session.flush()
        if event["type"] == "checkout.session.completed":
            checkout_session = event["data"]["object"]
            workspace_id = checkout_session.get("metadata", {}).get("workspace_id")
            subscription_id = checkout_session.get("subscription", "")
            plan_tier = checkout_session.get("metadata", {}).get("plan_tier", "Seed")
            if workspace_id:
                ws = (
                    await session.execute(select(Workspace).where(Workspace.id == workspace_id))
                ).scalar_one_or_none()
                if ws:
                    ws.stripe_customer_id = checkout_session.get("customer", ws.stripe_customer_id or "")
                    ws.stripe_subscription_id = subscription_id
                    ws.plan_tier = plan_tier
                    ws.subscription_status = "active"
                    await session.commit()
        elif event["type"] == "customer.subscription.updated":
            subscription = event["data"]["object"]
            subscription_id = subscription.get("id", "")
            status = _stripe_status_to_internal(subscription.get("status", ""))
            result = await session.execute(
                select(Workspace).where(Workspace.stripe_subscription_id == subscription_id)
            )
            ws = result.scalar_one_or_none()
            if ws:
                ws.subscription_status = status
                await session.commit()
        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            subscription_id = subscription.get("id", "")
            result = await session.execute(
                select(Workspace).where(Workspace.stripe_subscription_id == subscription_id)
            )
            ws = result.scalar_one_or_none()
            if ws:
                ws.subscription_status = "canceled"
                await session.commit()

    return {"received": True}

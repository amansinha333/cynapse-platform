import asyncio
import contextlib
import json
import logging
import uuid
from pathlib import Path

import httpx
import websockets
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy import select

from database import async_session
from models import AuditIntelligence, PolicyConflict

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BASE_URL = "http://127.0.0.1:8000"


def make_pdf(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(path), pagesize=letter)
    y = 760
    for line in lines:
        c.drawString(48, y, line)
        y -= 20
    c.save()


async def wait_for_event(events: list[dict], event_type: str, timeout: int = 120) -> dict | None:
    for _ in range(timeout * 2):
        for ev in events:
            if ev.get("type") == event_type:
                return ev
        await asyncio.sleep(0.5)
    return None


async def main() -> None:
    run_id = uuid.uuid4().hex[:8]
    email = f"phase4.followup.{run_id}@cynapse.local"
    password = "StrongPass1"

    events: list[dict] = []

    async with httpx.AsyncClient() as client:
        reg = await client.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "full_name": "Phase4 Followup",
                "email": email,
                "password": password,
                "workspace_name": f"Phase4 Followup {run_id}",
                "role": "admin",
            },
            timeout=30,
        )
        reg_json = reg.json()
        token = reg_json["access_token"]
        workspace_id = reg_json["user"]["workspace_id"]

        async def ws_listener() -> None:
            uri = f"ws://127.0.0.1:8000/ws/dashboard?token={token}"
            async with websockets.connect(uri) as ws:
                while True:
                    msg = await ws.recv()
                    parsed = json.loads(msg)
                    events.append(parsed)
                    if parsed.get("type") == "ping":
                        await ws.send(json.dumps({"type": "pong"}))

        ws_task = asyncio.create_task(ws_listener())
        await asyncio.sleep(1)

        # Two compliant feature saves to validate hash chaining.
        payload_a = {
            "title": "Access control review",
            "description": "Implement role-based encryption audit review process.",
            "region": "Global",
            "industry": "General SaaS / AI",
            "rice_score": 300.0,
        }
        payload_b = {
            "title": "Encryption key dashboard",
            "description": "Build dashboard for key rotation compliance visibility.",
            "region": "Global",
            "industry": "General SaaS / AI",
            "rice_score": 450.0,
        }
        save_a = await client.post(f"{BASE_URL}/api/features", json=payload_a, headers={"Authorization": f"Bearer {token}"}, timeout=60)
        save_b = await client.post(f"{BASE_URL}/api/features", json=payload_b, headers={"Authorization": f"Bearer {token}"}, timeout=60)

        async with async_session() as session:
            audits = (
                (
                    await session.execute(
                        select(AuditIntelligence)
                        .where(AuditIntelligence.workspace_id == workspace_id)
                        .order_by(AuditIntelligence.created_at.desc())
                        .limit(2)
                    )
                )
                .scalars()
                .all()
            )
        latest = audits[0] if audits else None
        previous = audits[1] if len(audits) > 1 else None

        # Conflict pair with intentionally near-identical language.
        pdir = Path("tmp_smoke_phase4")
        p1 = pdir / f"conflict_a_{run_id}.pdf"
        p2 = pdir / f"conflict_b_{run_id}.pdf"
        make_pdf(
            p1,
            [
                "Strict Data Minimization Policy",
                "All customer Personally Identifiable Information (PII) and account records MUST be permanently",
                "and irreversibly deleted within 30 days of account closure. No exceptions.",
            ],
        )
        make_pdf(
            p2,
            [
                "Financial Compliance Mandate",
                "To comply with federal auditing standards, all financial records and associated customer account",
                "PII MUST be retained in secure storage for a minimum of 7 years following account closure.",
            ],
        )

        with p1.open("rb") as f1:
            up1 = await client.post(
                f"{BASE_URL}/api/vault/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": (p1.name, f1, "application/pdf")},
                data={"feature_id": ""},
                timeout=120,
            )
        await wait_for_event(events, "audit_completed", timeout=180)
        # Allow Pinecone indexing to settle before second upload conflict query.
        await asyncio.sleep(15)
        with p2.open("rb") as f2:
            up2 = await client.post(
                f"{BASE_URL}/api/vault/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": (p2.name, f2, "application/pdf")},
                data={"feature_id": ""},
                timeout=120,
            )

        conflict_event = await wait_for_event(events, "conflict_detected", timeout=240)
        async with async_session() as session:
            conflict_row = (
                (
                    await session.execute(
                        select(PolicyConflict)
                        .where(PolicyConflict.workspace_id == workspace_id)
                        .order_by(PolicyConflict.created_at.desc())
                        .limit(1)
                    )
                )
                .scalar_one_or_none()
            )

        ws_task.cancel()
        with contextlib.suppress(BaseException):
            await ws_task

    logger.info(
        "%s",
        json.dumps(
            {
                "save_a_status": save_a.status_code,
                "save_b_status": save_b.status_code,
                "latest_decision_hash": getattr(latest, "decision_hash", None),
                "latest_previous_hash": getattr(latest, "previous_hash", None),
                "previous_decision_hash": getattr(previous, "decision_hash", None),
                "hash_chain_valid": bool(
                    latest and previous and latest.previous_hash == previous.decision_hash
                ),
                "upload1": up1.json(),
                "upload2": up2.json(),
                "conflict_event": conflict_event,
                "conflict_row": {
                    "id": getattr(conflict_row, "id", None),
                    "new_document_id": getattr(conflict_row, "new_document_id", None),
                    "existing_document_id": getattr(conflict_row, "existing_document_id", None),
                    "conflict_summary": getattr(conflict_row, "conflict_summary", None),
                },
            },
            indent=2,
            default=str,
        ),
    )


if __name__ == "__main__":
    asyncio.run(main())

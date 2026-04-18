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
from models import PolicyConflict

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BASE_URL = "http://127.0.0.1:8000"

DOC_A = (
    "Strict Data Minimization Policy: All customer Personally Identifiable Information (PII) "
    "and account records MUST be permanently and irreversibly deleted within 30 days of account closure. "
    "No exceptions."
)

DOC_B = (
    "Financial Compliance Mandate: To comply with federal auditing standards, all financial records "
    "and associated customer account PII MUST be retained in secure storage for a minimum of 7 years "
    "following account closure."
)


def make_pdf(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(path), pagesize=letter)
    y = 760
    for seg in [text[i : i + 95] for i in range(0, len(text), 95)]:
        pdf.drawString(48, y, seg)
        y -= 20
    pdf.save()


async def wait_event(events: list[dict], event_type: str, timeout_s: int) -> dict | None:
    for _ in range(timeout_s * 2):
        for event in events:
            if event.get("type") == event_type:
                return event
        await asyncio.sleep(0.5)
    return None


async def wait_conflict_row(workspace_id: str, timeout_s: int) -> dict | None:
    for _ in range(timeout_s * 2):
        async with async_session() as session:
            row = (
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
            if row:
                return {
                    "id": row.id,
                    "workspace_id": row.workspace_id,
                    "new_document_id": row.new_document_id,
                    "existing_document_id": row.existing_document_id,
                    "conflict_summary": row.conflict_summary,
                }
        await asyncio.sleep(0.5)
    return None


async def main() -> None:
    run_id = uuid.uuid4().hex[:8]
    email = f"phase4.detquick.{run_id}@cynapse.local"
    workspace_name = f"Phase4 DetQuick {run_id}"
    events: list[dict] = []

    pdir = Path("tmp_smoke_phase4")
    pa = pdir / f"det_a_{run_id}.pdf"
    pb = pdir / f"det_b_{run_id}.pdf"
    make_pdf(pa, DOC_A)
    make_pdf(pb, DOC_B)

    async with httpx.AsyncClient(timeout=120) as client:
        reg = await client.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "full_name": "Deterministic Quick Tester",
                "email": email,
                "password": "StrongPass1",
                "workspace_name": workspace_name,
                "role": "admin",
            },
        )
        reg_body = reg.json()
        token = reg_body["access_token"]
        workspace_id = reg_body["user"]["workspace_id"]

        async def ws_task_fn() -> None:
            uri = f"ws://127.0.0.1:8000/ws/dashboard?token={token}"
            async with websockets.connect(uri) as ws:
                while True:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    events.append(data)
                    if data.get("type") == "ping":
                        await ws.send(json.dumps({"type": "pong"}))

        ws_task = asyncio.create_task(ws_task_fn())
        await asyncio.sleep(1)

        with pa.open("rb") as f1:
            up1 = await client.post(
                f"{BASE_URL}/api/vault/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": (pa.name, f1, "application/pdf")},
                data={"feature_id": ""},
            )
        await wait_event(events, "audit_completed", 120)

        with pb.open("rb") as f2:
            up2 = await client.post(
                f"{BASE_URL}/api/vault/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": (pb.name, f2, "application/pdf")},
                data={"feature_id": ""},
            )

        conflict_event = await wait_event(events, "conflict_detected", 180)
        conflict_row = await wait_conflict_row(workspace_id, 180)

        ws_task.cancel()
        with contextlib.suppress(BaseException):
            await ws_task

    logger.info(
        "%s",
        json.dumps(
            {
                "register_status": reg.status_code,
                "workspace_id": workspace_id,
                "upload_a": {"status": up1.status_code, "body": up1.json()},
                "upload_b": {"status": up2.status_code, "body": up2.json()},
                "conflict_event": conflict_event,
                "policy_conflicts_row": conflict_row,
            },
            indent=2,
        ),
    )


if __name__ == "__main__":
    asyncio.run(main())

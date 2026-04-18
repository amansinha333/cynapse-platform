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

DOC_A_TEXT = (
    "Strict Data Minimization Policy: All customer Personally Identifiable Information (PII) "
    "and account records MUST be permanently and irreversibly deleted within 30 days of account closure. "
    "No exceptions."
)

DOC_B_TEXT = (
    "Financial Compliance Mandate: To comply with federal auditing standards, all financial records "
    "and associated customer account PII MUST be retained in secure storage for a minimum of 7 years "
    "following account closure."
)


def _make_pdf(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(path), pagesize=letter)
    y = 760
    for chunk in [text[i : i + 90] for i in range(0, len(text), 90)]:
        pdf.drawString(48, y, chunk)
        y -= 20
    pdf.save()


async def _wait_for_event(events: list[dict], event_type: str, timeout_seconds: int) -> dict | None:
    for _ in range(timeout_seconds * 2):
        for event in events:
            if event.get("type") == event_type:
                return event
        await asyncio.sleep(0.5)
    return None


async def _wait_for_conflict_row(workspace_id: str, timeout_seconds: int) -> dict | None:
    for _ in range(timeout_seconds * 2):
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
    email = f"phase4.det.{run_id}@cynapse.local"
    workspace_name = f"Phase4 Deterministic {run_id}"
    password = "StrongPass1"

    events: list[dict] = []
    temp_dir = Path("tmp_smoke_phase4")
    doc_a_path = temp_dir / f"deterministic_a_{run_id}.pdf"
    doc_b_path = temp_dir / f"deterministic_b_{run_id}.pdf"
    _make_pdf(doc_a_path, DOC_A_TEXT)
    _make_pdf(doc_b_path, DOC_B_TEXT)

    async with httpx.AsyncClient(timeout=120) as client:
        register_resp = await client.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "full_name": "Deterministic Conflict Tester",
                "email": email,
                "password": password,
                "workspace_name": workspace_name,
                "role": "admin",
            },
        )
        register_body = register_resp.json()
        token = register_body["access_token"]
        workspace_id = register_body["user"]["workspace_id"]

        async def ws_listener() -> None:
            uri = f"ws://127.0.0.1:8000/ws/dashboard?token={token}"
            async with websockets.connect(uri, open_timeout=10, close_timeout=5) as ws:
                while True:
                    msg = await ws.recv()
                    payload = json.loads(msg)
                    events.append(payload)
                    if payload.get("type") == "ping":
                        await ws.send(json.dumps({"type": "pong"}))

        ws_task = asyncio.create_task(ws_listener())
        await asyncio.sleep(1)

        with doc_a_path.open("rb") as f_a:
            upload_a = await client.post(
                f"{BASE_URL}/api/vault/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": (doc_a_path.name, f_a, "application/pdf")},
                data={"feature_id": ""},
            )
        upload_a_body = upload_a.json()
        await _wait_for_event(events, "audit_completed", timeout_seconds=180)

        with doc_b_path.open("rb") as f_b:
            upload_b = await client.post(
                f"{BASE_URL}/api/vault/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": (doc_b_path.name, f_b, "application/pdf")},
                data={"feature_id": ""},
            )
        upload_b_body = upload_b.json()

        conflict_event = await _wait_for_event(events, "conflict_detected", timeout_seconds=240)
        db_conflict_row = await _wait_for_conflict_row(workspace_id, timeout_seconds=240)

        ws_task.cancel()
        with contextlib.suppress(BaseException):
            await ws_task

    logger.info(
        "%s",
        json.dumps(
            {
                "register_status": register_resp.status_code,
                "workspace_id": workspace_id,
                "upload_a_status": upload_a.status_code,
                "upload_a_body": upload_a_body,
                "upload_b_status": upload_b.status_code,
                "upload_b_body": upload_b_body,
                "conflict_event": conflict_event,
                "policy_conflicts_row": db_conflict_row,
            },
            indent=2,
        ),
    )


if __name__ == "__main__":
    asyncio.run(main())

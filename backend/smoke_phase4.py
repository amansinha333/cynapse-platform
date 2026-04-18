import asyncio
import json
import logging
import re
import time
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
TOKEN_HEADER = "Authorization"
SHA256_RE = re.compile(r"^[a-f0-9]{64}$")


def _make_pdf(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(path), pagesize=letter)
    y = 760
    for line in lines:
        c.drawString(50, y, line)
        y -= 20
    c.save()


class WsCollector:
    def __init__(self, token: str) -> None:
        self.token = token
        self.events: list[dict] = []
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()

    async def start(self) -> None:
        self._task = asyncio.create_task(self._run())
        await asyncio.sleep(0.8)

    async def stop(self) -> None:
        self._stop.set()
        if self._task:
            await self._task

    async def _run(self) -> None:
        uri = f"ws://127.0.0.1:8000/ws/dashboard?token={self.token}"
        try:
            async with websockets.connect(uri, open_timeout=10, close_timeout=5) as ws:
                while not self._stop.is_set():
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=1)
                    except asyncio.TimeoutError:
                        continue
                    try:
                        payload = json.loads(msg)
                    except Exception:
                        continue
                    self.events.append(payload)
                    if payload.get("type") == "ping":
                        await ws.send(json.dumps({"type": "pong"}))
        except Exception as exc:
            self.events.append({"type": "ws_error", "message": str(exc)})

    async def wait_for_type(self, event_type: str, timeout: int = 60) -> dict | None:
        start = time.time()
        while time.time() - start <= timeout:
            for event in self.events:
                if event.get("type") == event_type:
                    return event
            await asyncio.sleep(0.5)
        return None


async def _upload_pdf(client: httpx.AsyncClient, token: str, pdf_path: Path, feature_id: str = "") -> dict:
    with pdf_path.open("rb") as fh:
        files = {"file": (pdf_path.name, fh, "application/pdf")}
        data = {"feature_id": feature_id}
        res = await client.post(
            f"{BASE_URL}/api/vault/upload",
            headers={TOKEN_HEADER: f"Bearer {token}"},
            files=files,
            data=data,
            timeout=120,
        )
    return {"status": res.status_code, "body": res.json()}


async def main() -> None:
    run_id = uuid.uuid4().hex[:8]
    email = f"phase4.smoke.{run_id}@cynapse.local"
    password = "StrongPass1"
    workspace_name = f"Phase4 Smoke {run_id}"
    outputs: dict[str, dict] = {}

    async with httpx.AsyncClient() as client:
        register_payload = {
            "full_name": "Phase4 Smoke Tester",
            "email": email,
            "password": password,
            "workspace_name": workspace_name,
            "role": "admin",
        }
        reg = await client.post(f"{BASE_URL}/api/auth/register", json=register_payload, timeout=30)
        reg_json = reg.json()
        token = reg_json["access_token"]
        user_id = reg_json["user"]["id"]
        workspace_id = reg_json["user"]["workspace_id"]
        outputs["register"] = {
            "request": {**register_payload, "password": "***"},
            "status": reg.status_code,
            "user_id": user_id,
            "workspace_id": workspace_id,
        }

        ws = WsCollector(token)
        await ws.start()
        ws_connected = await ws.wait_for_type("connected", timeout=15)
        outputs["websocket_connect"] = {"event": ws_connected}

        tmp_dir = Path("tmp_smoke_phase4")
        policy_hardgate_pdf = tmp_dir / "policy_hardgate.pdf"
        _make_pdf(
            policy_hardgate_pdf,
            [
                "Corporate Data Governance Policy",
                "It is strictly prohibited to sell unencrypted user data to third-party brokers.",
                "All user data must remain encrypted and confidential.",
            ],
        )
        upload_policy_hardgate = await _upload_pdf(client, token, policy_hardgate_pdf)
        outputs["upload_policy_for_hardgate"] = upload_policy_hardgate
        await ws.wait_for_type("audit_completed", timeout=120)

        block_payload = {
            "title": "Broker monetization channel",
            "description": "Sell unencrypted user data to third-party brokers for ad targeting.",
            "region": "Global",
            "industry": "General SaaS / AI",
            "status": "Discovery",
            "reach": 2000,
            "impact": 3,
            "confidence": 0.7,
            "effort": 2,
            "priority": "High",
        }
        block_res = await client.post(
            f"{BASE_URL}/api/features",
            json=block_payload,
            headers={TOKEN_HEADER: f"Bearer {token}"},
            timeout=60,
        )
        blocked_event = await ws.wait_for_type("compliance_blocked", timeout=20)
        outputs["hard_gate_block_case"] = {
            "request": block_payload,
            "status": block_res.status_code,
            "body": block_res.json() if block_res.headers.get("content-type", "").startswith("application/json") else block_res.text,
            "ws_event": blocked_event,
        }

        safe_payload = {
            "title": "Encrypted data retention dashboard",
            "description": "Create an internal dashboard to monitor encrypted retention schedules with role-based access.",
            "region": "Global",
            "industry": "General SaaS / AI",
            "status": "Discovery",
            "reach": 1200,
            "impact": 4,
            "confidence": 0.8,
            "effort": 8,
            "rice_score": 480.0,
            "priority": "Medium",
        }
        safe_res = await client.post(
            f"{BASE_URL}/api/features",
            json=safe_payload,
            headers={TOKEN_HEADER: f"Bearer {token}"},
            timeout=60,
        )
        safe_json = safe_res.json() if safe_res.headers.get("content-type", "").startswith("application/json") else {"raw": safe_res.text}
        safe_feature_id = safe_json.get("id", "")
        outputs["allowed_save_case"] = {
            "request": safe_payload,
            "status": safe_res.status_code,
            "body": safe_json,
        }

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
        latest = audits[0] if len(audits) > 0 else None
        previous = audits[1] if len(audits) > 1 else None
        outputs["crypto_ledger_check"] = {
            "latest_feature_id": getattr(latest, "feature_id", None),
            "latest_previous_hash": getattr(latest, "previous_hash", None),
            "latest_decision_hash": getattr(latest, "decision_hash", None),
            "latest_hash_is_sha256": bool(SHA256_RE.match(getattr(latest, "decision_hash", "") or "")),
            "chain_matches_previous": bool(
                latest and previous and getattr(latest, "previous_hash", "") == getattr(previous, "decision_hash", "")
            ),
        }

        policy_a_pdf = tmp_dir / "policy_a.pdf"
        policy_b_pdf = tmp_dir / "policy_b.pdf"
        _make_pdf(
            policy_a_pdf,
            [
                "Regulatory Policy A",
                "Customer account and transaction records must be retained for 5 years.",
            ],
        )
        _make_pdf(
            policy_b_pdf,
            [
                "Regulatory Policy B",
                "Customer account and transaction records must be deleted after 30 days.",
            ],
        )
        up_a = await _upload_pdf(client, token, policy_a_pdf)
        await ws.wait_for_type("audit_completed", timeout=120)
        up_b = await _upload_pdf(client, token, policy_b_pdf)

        conflict_event = await ws.wait_for_type("conflict_detected", timeout=150)
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
        outputs["conflict_detection"] = {
            "upload_a": up_a,
            "upload_b": up_b,
            "ws_event": conflict_event,
            "db_row": {
                "id": getattr(conflict_row, "id", None),
                "new_document_id": getattr(conflict_row, "new_document_id", None),
                "existing_document_id": getattr(conflict_row, "existing_document_id", None),
                "conflict_summary": getattr(conflict_row, "conflict_summary", None),
            },
        }

        jira_res = await client.post(
            f"{BASE_URL}/api/features/{safe_feature_id}/export/jira",
            headers={TOKEN_HEADER: f"Bearer {token}"},
            timeout=60,
        )
        jira_body = jira_res.json() if jira_res.headers.get("content-type", "").startswith("application/json") else jira_res.text
        outputs["jira_export"] = {
            "feature_id": safe_feature_id,
            "status": jira_res.status_code,
            "body": jira_body,
        }

        await ws.stop()

    logger.info("%s", json.dumps(outputs, indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(main())

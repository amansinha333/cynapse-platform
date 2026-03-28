from __future__ import annotations

import asyncio
import time
from typing import Any
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: set[WebSocket] = set()
        self.connection_users: dict[WebSocket, str] = {}
        self.user_connections: dict[str, set[WebSocket]] = {}
        self.last_pong_at: dict[WebSocket, float] = {}
        self.ping_tasks: dict[WebSocket, asyncio.Task] = {}
        self.ping_interval_seconds = 20
        self.pong_timeout_seconds = 60

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)
        self.connection_users[websocket] = user_id
        self.user_connections.setdefault(user_id, set()).add(websocket)
        self.last_pong_at[websocket] = time.monotonic()
        self.ping_tasks[websocket] = asyncio.create_task(self._ping_loop(websocket))

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)
        user_id = self.connection_users.pop(websocket, "")
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                self.user_connections.pop(user_id, None)
        self.last_pong_at.pop(websocket, None)
        ping_task = self.ping_tasks.pop(websocket, None)
        if ping_task:
            ping_task.cancel()

    def touch_pong(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.last_pong_at[websocket] = time.monotonic()

    async def send_personal(self, websocket: WebSocket, message: dict[str, Any]) -> None:
        await websocket.send_json(message)

    async def broadcast(self, message: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                stale.append(connection)
        for connection in stale:
            self.disconnect(connection)

    async def send_to_user(self, user_id: str, message: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for connection in list(self.user_connections.get(user_id, set())):
            try:
                await connection.send_json(message)
            except Exception:
                stale.append(connection)
        for connection in stale:
            self.disconnect(connection)

    async def _ping_loop(self, websocket: WebSocket) -> None:
        try:
            while websocket in self.active_connections:
                await asyncio.sleep(self.ping_interval_seconds)
                await websocket.send_json({"type": "ping", "ts": int(time.time())})
                last_pong = self.last_pong_at.get(websocket, 0.0)
                if time.monotonic() - last_pong > self.pong_timeout_seconds:
                    await websocket.close(code=1001, reason="Pong timeout")
                    self.disconnect(websocket)
                    return
        except asyncio.CancelledError:
            return
        except Exception:
            self.disconnect(websocket)


dashboard_manager = ConnectionManager()

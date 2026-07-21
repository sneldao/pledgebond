import json
import logging
from datetime import datetime, timezone
from typing import Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, Set[WebSocket]] = {}
        self.user_connections: dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, bond_id: str, user_id: Optional[str] = None):
        await websocket.accept()
        if bond_id not in self.active_connections:
            self.active_connections[bond_id] = set()
        self.active_connections[bond_id].add(websocket)
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, bond_id: str, user_id: Optional[str] = None):
        if bond_id in self.active_connections:
            self.active_connections[bond_id].discard(websocket)
            if not self.active_connections[bond_id]:
                del self.active_connections[bond_id]
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def broadcast_to_bond(self, bond_id: str, message: dict):
        if bond_id not in self.active_connections:
            return
        dead = []
        for conn in self.active_connections[bond_id]:
            try:
                await conn.send_json(message)
            except Exception:
                dead.append(conn)
        for conn in dead:
            self.active_connections[bond_id].discard(conn)

    async def send_to_user(self, user_id: str, message: dict):
        if user_id not in self.user_connections:
            return
        dead = []
        for conn in self.user_connections[user_id]:
            try:
                await conn.send_json(message)
            except Exception:
                dead.append(conn)
        for conn in dead:
            self.user_connections[user_id].discard(conn)

    def get_bond_viewers(self, bond_id: str) -> int:
        return len(self.active_connections.get(bond_id, set()))

    def get_bond_viewer_ids(self, bond_id: str) -> list:
        count = self.get_bond_viewers(bond_id)
        return count


manager = ConnectionManager()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def ws_endpoint(websocket: WebSocket, bond_id: str, db, user_id: Optional[str] = None):
    await manager.connect(websocket, bond_id, user_id)

    try:
        await manager.broadcast_to_bond(bond_id, {
            "type": "presence",
            "viewers": manager.get_bond_viewers(bond_id),
            "timestamp": _now_iso(),
        })

        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                msg_type = msg.get("type", "")

                if msg_type == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": _now_iso()})
                elif msg_type == "chat":
                    chat_msg = {
                        "type": "chat",
                        "user_id": user_id or "anonymous",
                        "user_name": msg.get("user_name", "Anonymous"),
                        "message": msg.get("message", "")[:500],
                        "timestamp": _now_iso(),
                    }
                    await manager.broadcast_to_bond(bond_id, chat_msg)
                elif msg_type == "reaction":
                    reaction_msg = {
                        "type": "reaction",
                        "user_id": user_id or "anonymous",
                        "emoji": msg.get("emoji", "🔥"),
                        "timestamp": _now_iso(),
                    }
                    await manager.broadcast_to_bond(bond_id, reaction_msg)

            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, bond_id, user_id)
        remaining = manager.get_bond_viewers(bond_id)
        await manager.broadcast_to_bond(bond_id, {
            "type": "presence",
            "viewers": remaining,
            "timestamp": _now_iso(),
        })
    except Exception as e:
        logger.exception("WebSocket error: %s", e)
        manager.disconnect(websocket, bond_id, user_id)


async def emit_bond_event(bond_id: str, event_type: str, data: dict):
    await manager.broadcast_to_bond(bond_id, {
        "type": event_type,
        "data": data,
        "timestamp": _now_iso(),
    })


async def emit_user_notification(user_id: str, notification_type: str, data: dict):
    await manager.send_to_user(user_id, {
        "type": "notification",
        "notification_type": notification_type,
        "data": data,
        "timestamp": _now_iso(),
    })

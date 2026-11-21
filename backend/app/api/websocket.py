"""
WebSocket Endpoints:
- /ws/live : Broadcasts live signal states, densities, emergency corridors, and real-time events.
- /ws/driver/{request_id} : Dedicated channel for driver corridor progress.
"""
import asyncio
import json
import logging
from typing import List, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.simulation import sim_engine
from app.utils.events import event_broadcast_queue

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.driver_connections: dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def connect_driver(self, request_id: int, websocket: WebSocket):
        await websocket.accept()
        if request_id not in self.driver_connections:
            self.driver_connections[request_id] = set()
        self.driver_connections[request_id].add(websocket)

    def disconnect_driver(self, request_id: int, websocket: WebSocket):
        if request_id in self.driver_connections:
            self.driver_connections[request_id].discard(websocket)

    async def broadcast_live(self, data: dict):
        text = json.dumps(data)
        to_remove = set()
        for conn in self.active_connections:
            try:
                await conn.send_text(text)
            except Exception:
                to_remove.add(conn)
        for conn in to_remove:
            self.active_connections.discard(conn)

    async def broadcast_driver(self, request_id: int, data: dict):
        if request_id in self.driver_connections:
            text = json.dumps(data)
            to_remove = set()
            for conn in self.driver_connections[request_id]:
                try:
                    await conn.send_text(text)
                except Exception:
                    to_remove.add(conn)
            for conn in to_remove:
                self.driver_connections[request_id].discard(conn)


manager = ConnectionManager()


@router.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Send current live state every second
            state = sim_engine.get_live_state()
            await websocket.send_text(json.dumps({"type": "LIVE_STATE", "data": state}))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.debug("WS live connection closed: %s", e)
        manager.disconnect(websocket)


@router.websocket("/ws/driver/{request_id}")
async def websocket_driver_endpoint(websocket: WebSocket, request_id: int):
    await manager.connect_driver(request_id, websocket)
    try:
        while True:
            run = sim_engine.emergency_manager.active_runs.get(request_id)
            if run:
                await websocket.send_text(json.dumps({"type": "CORRIDOR_UPDATE", "data": run}))
            else:
                await websocket.send_text(json.dumps({
                    "type": "CORRIDOR_UPDATE",
                    "data": {
                        "request_id": request_id,
                        "status": "COMPLETED",
                        "junction_status": {},
                    }
                }))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        manager.disconnect_driver(request_id, websocket)
    except Exception as e:
        logger.debug("WS driver connection closed: %s", e)
        manager.disconnect_driver(request_id, websocket)

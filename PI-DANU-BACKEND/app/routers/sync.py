from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api/sync", tags=["sync"])

_sync_status = {
    "online": True,
    "pending_sync": 0,
    "last_sync": datetime.utcnow().isoformat(),
}


@router.get("/status")
async def get_sync_status():
    return _sync_status


@router.post("/push")
async def push_sync(changes: list = []):
    count = len(changes)
    _sync_status["pending_sync"] = max(0, _sync_status["pending_sync"] - count)
    _sync_status["last_sync"] = datetime.utcnow().isoformat()
    return {"status": "ok", "synced": count}

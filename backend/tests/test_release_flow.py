"""Tests for POST /bonds/{id}/release — the climax of the demo.

Covers: completion met → released, not met → failed, wrong status → 400,
404 for missing bond, and that released/failed are terminal.
"""
from datetime import datetime, timezone, timedelta

from tests.test_state_machine import _bond, _participants


async def test_release_active_completion_met_returns_released(client, mock_db):
    bond = _bond(
        status="active",
        participants=_participants(4, completed_all=True),
    )
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/release")
    assert r.status_code == 200
    assert r.json()["status"] == "released"
    stored = await mock_db.bonds.find_one({"id": "b1"}, {"_id": 0})
    assert stored["status"] == "released"


async def test_release_active_completion_not_met_returns_failed(client, mock_db):
    bond = _bond(
        status="active",
        participants=_participants(4, completed_all=False),
    )
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/release")
    assert r.status_code == 200
    assert r.json()["status"] == "failed"
    stored = await mock_db.bonds.find_one({"id": "b1"}, {"_id": 0})
    assert stored["status"] == "failed"


async def test_release_partial_completion_respects_target(client, mock_db):
    # 10 participants, 7 complete -> 70% >= 70% -> released
    parts = _participants(7, completed_all=True) + _participants(3, completed_all=False)
    bond = _bond(status="active", participants=parts, completion_target_percent=70)
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/release")
    assert r.status_code == 200
    assert r.json()["status"] == "released"


async def test_release_pending_returns_400(client, mock_db):
    bond = _bond(status="pending", participants=_participants(1))
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/release")
    assert r.status_code == 400
    assert "pending" in r.json()["detail"]


async def test_release_released_returns_400(client, mock_db):
    bond = _bond(status="released", participants=_participants(4, completed_all=True))
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/release")
    assert r.status_code == 400


async def test_release_failed_returns_400(client, mock_db):
    bond = _bond(status="failed", participants=_participants(4))
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/release")
    assert r.status_code == 400


async def test_release_missing_bond_returns_404(client, mock_db):
    r = await client.post("/api/bonds/nonexistent/release")
    assert r.status_code == 404


async def test_release_is_terminal_then_get_stays_released(client, mock_db):
    """After release, a GET must not flip the status back."""
    bond = _bond(
        status="active",
        participants=_participants(4, completed_all=True),
        deadline=(datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
    )
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/release")
    assert r.json()["status"] == "released"

    r2 = await client.get("/api/bonds/b1")
    assert r2.json()["status"] == "released"

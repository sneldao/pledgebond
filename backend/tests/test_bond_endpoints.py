"""Tests for create / list / get / reset / delete endpoints and defaults.

Covers: default payout split, seal_style default, payout percent sum
validation is NOT enforced server-side (documented), reset clears state,
delete removes the bond, list filtering by status.
"""
from datetime import datetime, timezone, timedelta

from tests.test_state_machine import _bond, _participants


# ---------- create ----------

async def test_create_bond_defaults(client, mock_db):
    r = await client.post("/api/bonds", json={
        "title": "New Bond",
        "funder_amount": 1000,
        "activation_threshold": 100,
        "fundee_pledge_amount": 25,
        "deadline": "2099-01-01T00:00:00+00:00",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "pending"
    assert body["seal_style"] == "burgundy"
    assert body["completion_target_percent"] == 70
    # Default payout split 50/25/20/5
    labels = [p["label"] for p in body["payout_split"]]
    percents = [p["percent"] for p in body["payout_split"]]
    assert sum(percents) == 100
    assert len(body["payout_split"]) == 4


async def test_create_bond_preserves_custom_split(client, mock_db):
    r = await client.post("/api/bonds", json={
        "title": "Custom",
        "funder_amount": 500,
        "activation_threshold": 50,
        "fundee_pledge_amount": 10,
        "deadline": "2099-01-01T00:00:00+00:00",
        "payout_split": [
            {"label": "Cause", "percent": 80},
            {"label": "Platform", "percent": 20},
        ],
    })
    assert r.status_code == 200
    body = r.json()
    assert len(body["payout_split"]) == 2
    assert body["payout_split"][0]["label"] == "Cause"


async def test_create_bond_with_tasks(client, mock_db):
    r = await client.post("/api/bonds", json={
        "title": "With Tasks",
        "funder_amount": 500,
        "activation_threshold": 50,
        "fundee_pledge_amount": 10,
        "deadline": "2099-01-01T00:00:00+00:00",
        "task_requirements": [
            {"title": "Run", "task_type": "binary", "verification": "self_report"},
            {"title": "Time", "task_type": "timed_ranked", "verification": "numeric", "target": 30, "unit": "sec"},
        ],
    })
    assert r.status_code == 200
    tasks = r.json()["task_requirements"]
    assert len(tasks) == 2
    assert tasks[0]["task_type"] == "binary"
    assert tasks[1]["verification"] == "numeric"


# ---------- get / list ----------

async def test_get_missing_bond_returns_404(client, mock_db):
    r = await client.get("/api/bonds/nope")
    assert r.status_code == 404


async def test_list_bonds_filter_by_status(client, mock_db):
    await mock_db.bonds.insert_one(dict(_bond(id="a", status="pending"), _id="a"))
    await mock_db.bonds.insert_one(dict(_bond(id="b", status="active", participants=_participants(4)), _id="b"))

    r = await client.get("/api/bonds?status=active")
    assert r.status_code == 200
    ids = [b["id"] for b in r.json()]
    assert ids == ["b"]


async def test_list_bonds_filter_by_category(client, mock_db):
    await mock_db.bonds.insert_one(dict(_bond(id="a", category="individual"), _id="a"))
    await mock_db.bonds.insert_one(dict(_bond(id="b", category="corporate"), _id="b"))

    r = await client.get("/api/bonds?category=corporate")
    assert r.status_code == 200
    ids = [b["id"] for b in r.json()]
    assert ids == ["b"]


# ---------- reset ----------

async def test_reset_clears_participants_and_proofs(client, mock_db):
    bond = _bond(
        status="active",
        participants=_participants(4, completed_all=True),
        proofs=[{"id": "x", "participant_id": "p0", "task_id": "t1", "kind": "self", "note": "", "numeric_value": None, "image_data_url": None, "submitted_at": datetime.now(timezone.utc).isoformat()}],
    )
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/reset")
    assert r.status_code == 200
    body = r.json()
    assert body["participants"] == []
    assert body["proofs"] == []
    assert body["status"] == "pending"


async def test_reset_missing_bond_returns_404(client, mock_db):
    r = await client.post("/api/bonds/nope/reset")
    assert r.status_code == 404


# ---------- delete ----------

async def test_delete_bond(client, mock_db):
    await mock_db.bonds.insert_one(dict(_bond(id="b1"), _id="b1"))
    r = await client.delete("/api/bonds/b1")
    assert r.status_code == 200
    assert r.json()["deleted"] == 1
    stored = await mock_db.bonds.find_one({"id": "b1"})
    assert stored is None


async def test_delete_missing_bond(client, mock_db):
    r = await client.delete("/api/bonds/nope")
    assert r.status_code == 200
    assert r.json()["deleted"] == 0

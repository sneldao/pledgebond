"""Tests for the join + proof submission flow.

Covers: joining a pending bond, auto-activation when threshold is reached,
proof submission marking tasks complete, score accumulation for numeric
proofs, and the guard rails (wrong status, unknown participant/task).
"""
import uuid

from tests.test_state_machine import _bond, _participants, _participant


async def test_join_pending_bond_adds_participant(client, mock_db):
    bond = _bond(participants=[])  # threshold 100, pledge 25
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/join", json={"display_name": "Ada Lovelace"})
    assert r.status_code == 200
    body = r.json()
    assert len(body["participants"]) == 1
    assert body["participants"][0]["display_name"] == "Ada Lovelace"
    assert body["participants"][0]["initials"] == "AL"
    assert body["status"] == "pending"  # 25 < 100


async def test_join_auto_activates_when_threshold_reached(client, mock_db):
    bond = _bond(participants=[])  # threshold 100, pledge 25 -> 4 joins needed
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    for i in range(3):
        r = await client.post("/api/bonds/b1/join", json={"display_name": f"User {i}"})
        assert r.json()["status"] == "pending"
    # 4th join pushes total_pledged to 100 -> active
    r = await client.post("/api/bonds/b1/join", json={"display_name": "User 3"})
    assert r.status_code == 200
    assert r.json()["status"] == "active"


async def test_join_released_bond_returns_400(client, mock_db):
    bond = _bond(status="released", participants=_participants(4, completed_all=True))
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/join", json={"display_name": "Late Joiner"})
    assert r.status_code == 400


async def test_join_missing_bond_returns_404(client, mock_db):
    r = await client.post("/api/bonds/nope/join", json={"display_name": "X"})
    assert r.status_code == 404


async def test_submit_proof_marks_task_complete(client, mock_db):
    task_id = str(uuid.uuid4())
    bond = _bond(
        status="active",
        participants=[_participant()],
        task_requirements=[{"id": task_id, "title": "T", "task_type": "binary", "verification": "self_report"}],
    )
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/proof", json={
        "participant_id": "p0", "task_id": task_id, "kind": "self", "note": "done",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["participants"][0]["completed_tasks"] == [task_id]
    assert len(body["proofs"]) == 1
    assert body["proofs"][0]["kind"] == "self"


async def test_submit_proof_numeric_accumulates_score(client, mock_db):
    task_id = str(uuid.uuid4())
    bond = _bond(
        status="active",
        participants=[_participant()],
        task_requirements=[{"id": task_id, "title": "Solve", "task_type": "timed_ranked", "verification": "numeric", "target": 30}],
    )
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/proof", json={
        "participant_id": "p0", "task_id": task_id, "kind": "numeric", "numeric_value": 28.5,
    })
    assert r.status_code == 200
    assert r.json()["participants"][0]["score"] == 28.5


async def test_submit_proof_does_not_duplicate_task(client, mock_db):
    """Re-submitting proof for an already-completed task shouldn't double-add it."""
    task_id = str(uuid.uuid4())
    bond = _bond(
        status="active",
        participants=[_participant(completed=[task_id])],
        task_requirements=[{"id": task_id, "title": "T", "task_type": "binary", "verification": "self_report"}],
    )
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/proof", json={
        "participant_id": "p0", "task_id": task_id, "kind": "self",
    })
    assert r.status_code == 200
    assert r.json()["participants"][0]["completed_tasks"] == [task_id]


async def test_submit_proof_pending_bond_returns_400(client, mock_db):
    bond = _bond(status="pending", participants=[_participant()],
                 task_requirements=[{"id": "t1", "title": "T", "task_type": "binary", "verification": "self_report"}])
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/proof", json={
        "participant_id": "p0", "task_id": "t1", "kind": "self",
    })
    assert r.status_code == 400


async def test_submit_proof_unknown_participant_returns_404(client, mock_db):
    bond = _bond(status="active", participants=[_participant()],
                 task_requirements=[{"id": "t1", "title": "T", "task_type": "binary", "verification": "self_report"}])
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/proof", json={
        "participant_id": "ghost", "task_id": "t1", "kind": "self",
    })
    assert r.status_code == 404


async def test_submit_proof_unknown_task_returns_404(client, mock_db):
    bond = _bond(status="active", participants=[_participant()],
                 task_requirements=[{"id": "t1", "title": "T", "task_type": "binary", "verification": "self_report"}])
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.post("/api/bonds/b1/proof", json={
        "participant_id": "p0", "task_id": "nope", "kind": "self",
    })
    assert r.status_code == 404


async def test_full_lifecycle_join_proof_release(client, mock_db):
    """End-to-end: create → join to activate → proof → release."""
    task_id = str(uuid.uuid4())
    create_body = {
        "title": "Test Bond",
        "funder_amount": 1000,
        "activation_threshold": 50,
        "fundee_pledge_amount": 25,
        "deadline": "2099-01-01T00:00:00+00:00",
        "task_requirements": [{"id": task_id, "title": "Do the thing", "task_type": "binary", "verification": "self_report"}],
        "completion_target_percent": 100,
    }
    r = await client.post("/api/bonds", json=create_body)
    assert r.status_code == 200
    bond_id = r.json()["id"]
    assert r.json()["status"] == "pending"

    # 2 joins -> 50 >= 50 -> active
    for i in range(2):
        r = await client.post(f"/api/bonds/{bond_id}/join", json={"display_name": f"U{i}"})
    assert r.json()["status"] == "active"

    # Both participants complete the task
    for p in r.json()["participants"]:
        r = await client.post(f"/api/bonds/{bond_id}/proof", json={
            "participant_id": p["id"], "task_id": task_id, "kind": "self", "note": "ok",
        })
        assert r.status_code == 200

    # Release -> 100% completion -> released
    r = await client.post(f"/api/bonds/{bond_id}/release")
    assert r.status_code == 200
    assert r.json()["status"] == "released"

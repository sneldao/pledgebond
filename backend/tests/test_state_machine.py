"""Tests for the bond state machine: _compute_status and lazy transitions.

Covers the core lifecycle the brief cares about:
  pending --threshold--> active --deadline+completion--> released | failed
  released/failed are terminal (lazy compute must not revive them)
"""
from datetime import datetime, timezone, timedelta

import server as server_module
from server import _compute_status, _completion_met


def _bond(**overrides):
    base = {
        "id": "b1",
        "title": "Test Bond",
        "description": "",
        "category": "individual",
        "cause_name": "",
        "cause_link": "",
        "funder_name": "",
        "funder_amount": 1000,
        "activation_threshold": 100,
        "fundee_pledge_amount": 25,
        "deadline": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "status": "pending",
        "task_requirements": [
            {"id": "t1", "title": "Task 1", "description": "", "task_type": "binary", "verification": "self_report", "target": None, "unit": ""},
            {"id": "t2", "title": "Task 2", "description": "", "task_type": "binary", "verification": "self_report", "target": None, "unit": ""},
        ],
        "participants": [],
        "proofs": [],
        "payout_split": [
            {"label": "Cause", "percent": 50},
            {"label": "Other", "percent": 50},
        ],
        "completion_target_percent": 70,
        "seal_style": "burgundy",
        "cover_emoji": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    base.update(overrides)
    return base


def _participants(n, completed_all=False, task_ids=("t1", "t2")):
    out = []
    for i in range(n):
        out.append({
            "id": f"p{i}",
            "display_name": f"Participant {i}",
            "initials": f"P{i}",
            "color": "#7B1730",
            "joined_at": datetime.now(timezone.utc).isoformat(),
            "completed_tasks": list(task_ids) if completed_all else [],
            "score": 0.0,
        })
    return out


def _participant(pid="p0", name="A", completed=None, score=0.0):
    return {
        "id": pid,
        "display_name": name,
        "initials": name[:2].upper(),
        "color": "#7B1730",
        "joined_at": datetime.now(timezone.utc).isoformat(),
        "completed_tasks": completed or [],
        "score": score,
    }


# ---------- _compute_status: pending ----------

def test_pending_below_threshold_stays_pending():
    bond = _bond(participants=_participants(2))  # 2*25=50 < 100
    assert _compute_status(bond) == "pending"


def test_pending_at_threshold_flips_to_active():
    bond = _bond(participants=_participants(4))  # 4*25=100 >= 100
    assert _compute_status(bond) == "active"


def test_pending_past_deadline_without_threshold_flips_to_failed():
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    bond = _bond(deadline=past, participants=_participants(1))
    assert _compute_status(bond) == "failed"


# ---------- _compute_status: active ----------

def test_active_before_deadline_stays_active():
    future = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    bond = _bond(status="active", deadline=future, participants=_participants(4))
    assert _compute_status(bond) == "active"


def test_active_past_deadline_completion_met_flips_to_released():
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    # 4 participants, all complete both tasks -> 100% >= 70%
    bond = _bond(
        status="active", deadline=past,
        participants=_participants(4, completed_all=True),
    )
    assert _compute_status(bond) == "released"


def test_active_past_deadline_completion_not_met_flips_to_failed():
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    # 4 participants, none complete -> 0% < 70%
    bond = _bond(
        status="active", deadline=past,
        participants=_participants(4, completed_all=False),
    )
    assert _compute_status(bond) == "failed"


def test_active_past_deadline_partial_completion_respects_target_percent():
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    # 10 participants, 7 complete -> 70% >= 70% target -> released
    parts = _participants(7, completed_all=True) + _participants(3, completed_all=False)
    bond = _bond(
        status="active", deadline=past,
        participants=parts, completion_target_percent=70,
    )
    assert _compute_status(bond) == "released"
    # 6 complete -> 60% < 70% -> failed
    parts2 = _participants(6, completed_all=True) + _participants(4, completed_all=False)
    bond2 = _bond(
        status="active", deadline=past,
        participants=parts2, completion_target_percent=70,
    )
    assert _compute_status(bond2) == "failed"


# ---------- terminal states ----------

def test_released_is_terminal():
    past = (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
    bond = _bond(status="released", deadline=past, participants=_participants(4, completed_all=True))
    assert _compute_status(bond) == "released"


def test_failed_is_terminal():
    future = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    # Even if threshold would now be met, failed stays failed.
    bond = _bond(status="failed", deadline=future, participants=_participants(4, completed_all=True))
    assert _compute_status(bond) == "failed"


def test_draft_is_terminal():
    bond = _bond(status="draft", participants=_participants(4, completed_all=True))
    assert _compute_status(bond) == "draft"


# ---------- _completion_met edge cases ----------

def test_completion_met_false_with_no_participants():
    bond = _bond(participants=[], task_requirements=[{"id": "t1"}])
    assert _completion_met(bond) is False


def test_completion_met_false_with_no_tasks():
    bond = _bond(participants=_participants(4), task_requirements=[])
    assert _completion_met(bond) is False


def test_completion_met_requires_all_tasks_per_participant():
    parts = [
        {"id": "p0", "completed_tasks": ["t1", "t2"]},  # complete
        {"id": "p1", "completed_tasks": ["t1"]},         # partial — not counted
    ]
    bond = _bond(participants=parts, completion_target_percent=50)
    # 1/2 = 50% >= 50% -> met
    assert _completion_met(bond) is True
    bond["completion_target_percent"] = 51
    assert _completion_met(bond) is False


# ---------- lazy transitions via the API ----------

async def test_get_bond_lazily_flips_pending_to_active(client, mock_db):
    """GET /bonds/{id} should persist a pending→active transition when threshold is met."""
    bond = _bond(participants=_participants(4))  # meets threshold
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.get("/api/bonds/b1")
    assert r.status_code == 200
    assert r.json()["status"] == "active"
    # Persisted
    stored = await mock_db.bonds.find_one({"id": "b1"}, {"_id": 0})
    assert stored["status"] == "active"


async def test_list_bonds_lazily_transitions(client, mock_db):
    bond = _bond(participants=_participants(4))
    await mock_db.bonds.insert_one(dict(bond, _id="b1"))

    r = await client.get("/api/bonds")
    assert r.status_code == 200
    found = [b for b in r.json() if b["id"] == "b1"]
    assert found and found[0]["status"] == "active"

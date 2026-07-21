#!/usr/bin/env python3
"""
Backend API tests for Pledgebond demo mode.
Tests the PUBLIC endpoint: https://vault-pledge.preview.emergentagent.com
"""
import requests
import sys
from datetime import datetime, timezone, timedelta

class PledgebondAPITester:
    def __init__(self, base_url="https://vault-pledge.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_bond_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_config(self):
        """Test GET /api/config - should return all flags false, demo_mode=true"""
        success, response = self.run_test(
            "GET /api/config (demo mode)",
            "GET",
            "api/config",
            200
        )
        if success:
            features = response.get('features', {})
            demo_mode = response.get('demo_mode', False)
            if demo_mode and not any(features.values()):
                print(f"   ✓ Demo mode enabled, all flags OFF: {features}")
            else:
                print(f"   ⚠ Unexpected config: demo_mode={demo_mode}, features={features}")
                return False
        return success

    def test_list_bonds(self):
        """Test GET /api/bonds - should return 4 seeded bonds"""
        success, response = self.run_test(
            "GET /api/bonds (4 seeded bonds)",
            "GET",
            "api/bonds",
            200
        )
        if success:
            if len(response) == 4:
                print(f"   ✓ Found 4 seeded bonds")
                titles = [b['title'] for b in response]
                print(f"   Bonds: {titles}")
                # Store a bond ID for later tests
                self.rubiks_bond = next((b for b in response if "Rubik" in b['title']), None)
                self.pending_bond = next((b for b in response if b['status'] == 'pending'), None)
            else:
                print(f"   ⚠ Expected 4 bonds, got {len(response)}")
                return False
        return success

    def test_get_bond(self, bond_id):
        """Test GET /api/bonds/{id}"""
        success, response = self.run_test(
            f"GET /api/bonds/{bond_id}",
            "GET",
            f"api/bonds/{bond_id}",
            200
        )
        if success:
            print(f"   ✓ Bond: {response.get('title')} - Status: {response.get('status')}")
        return success

    def test_create_bond(self):
        """Test POST /api/bonds - create new bond"""
        deadline = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        bond_data = {
            "title": "E2E Test Bond",
            "description": "Test bond created by automated testing",
            "category": "individual",
            "cause_name": "Test Cause",
            "funder_name": "Test Funder",
            "funder_amount": 1000,
            "activation_threshold": 100,
            "fundee_pledge_amount": 25,
            "deadline": deadline,
            "task_requirements": [
                {
                    "title": "Complete Task 1",
                    "task_type": "binary",
                    "verification": "self_report"
                },
                {
                    "title": "Complete Task 2",
                    "task_type": "binary",
                    "verification": "self_report"
                }
            ],
            "payout_split": [
                {"label": "Test Cause", "percent": 100}
            ],
            "completion_target_percent": 100,
            "seal_style": "burgundy"
        }
        
        success, response = self.run_test(
            "POST /api/bonds (create bond)",
            "POST",
            "api/bonds",
            200,
            data=bond_data
        )
        if success:
            self.test_bond_id = response.get('id')
            print(f"   ✓ Created bond ID: {self.test_bond_id}")
        return success

    def test_join_bond(self, bond_id, display_name):
        """Test POST /api/bonds/{id}/join"""
        success, response = self.run_test(
            f"POST /api/bonds/{bond_id}/join ({display_name})",
            "POST",
            f"api/bonds/{bond_id}/join",
            200,
            data={"display_name": display_name, "color": "#7B1730"}
        )
        if success:
            participants = response.get('participants', [])
            status = response.get('status')
            print(f"   ✓ Participants: {len(participants)}, Status: {status}")
        return success

    def test_submit_proof(self, bond_id, participant_id, task_id):
        """Test POST /api/bonds/{id}/proof"""
        success, response = self.run_test(
            f"POST /api/bonds/{bond_id}/proof",
            "POST",
            f"api/bonds/{bond_id}/proof",
            200,
            data={
                "participant_id": participant_id,
                "task_id": task_id,
                "kind": "self",
                "note": "Task completed"
            }
        )
        if success:
            print(f"   ✓ Proof submitted for task {task_id}")
        return success

    def test_release_bond(self, bond_id):
        """Test POST /api/bonds/{id}/release"""
        success, response = self.run_test(
            f"POST /api/bonds/{bond_id}/release",
            "POST",
            f"api/bonds/{bond_id}/release",
            200
        )
        if success:
            status = response.get('status')
            print(f"   ✓ Bond status after release: {status}")
        return success

    def test_reset_bond(self, bond_id):
        """Test POST /api/bonds/{id}/reset"""
        success, response = self.run_test(
            f"POST /api/bonds/{bond_id}/reset",
            "POST",
            f"api/bonds/{bond_id}/reset",
            200
        )
        if success:
            participants = response.get('participants', [])
            status = response.get('status')
            print(f"   ✓ After reset - Participants: {len(participants)}, Status: {status}")
        return success

    def test_auth_disabled(self):
        """Test that auth endpoints return 404 when ENABLE_AUTH=0"""
        success, _ = self.run_test(
            "GET /api/auth/me (should 404)",
            "GET",
            "api/auth/me",
            404
        )
        return success

    def test_payments_disabled(self):
        """Test that payment endpoints return 404 when ENABLE_PAYMENTS=0"""
        success, _ = self.run_test(
            "GET /api/payments/methods (should 404)",
            "GET",
            "api/payments/methods",
            404
        )
        return success

def main():
    print("=" * 60)
    print("Pledgebond Backend API Tests (Demo Mode)")
    print("=" * 60)
    
    tester = PledgebondAPITester()

    # Test 1: Config endpoint
    tester.test_config()

    # Test 2: List bonds
    tester.test_list_bonds()

    # Test 3: Get individual bond
    if tester.pending_bond:
        tester.test_get_bond(tester.pending_bond['id'])

    # Test 4: Create new bond
    tester.test_create_bond()

    # Test 5: Join bond (test auto-activation)
    if tester.test_bond_id:
        # Join 4 times to reach threshold (4 * 25 = 100)
        for i in range(4):
            tester.test_join_bond(tester.test_bond_id, f"Test User {i+1}")

    # Test 6: Submit proofs
    if tester.test_bond_id:
        # Get the bond to get participant and task IDs
        success, bond = tester.run_test(
            "Get bond for proof submission",
            "GET",
            f"api/bonds/{tester.test_bond_id}",
            200
        )
        if success and bond.get('status') == 'active':
            participants = bond.get('participants', [])
            tasks = bond.get('task_requirements', [])
            if participants and tasks:
                # Submit proofs for all participants and all tasks
                for p in participants:
                    for t in tasks:
                        tester.test_submit_proof(tester.test_bond_id, p['id'], t['id'])

    # Test 7: Release bond
    if tester.test_bond_id:
        tester.test_release_bond(tester.test_bond_id)

    # Test 8: Test Rubik's Cube bond release (should succeed - 8/10 completed, 60% target)
    if tester.rubiks_bond:
        print(f"\n🎯 Testing Rubik's Cube bond release (should succeed)...")
        tester.test_release_bond(tester.rubiks_bond['id'])

    # Test 9: Reset bond
    if tester.test_bond_id:
        tester.test_reset_bond(tester.test_bond_id)

    # Test 10: Auth disabled
    tester.test_auth_disabled()

    # Test 11: Payments disabled
    tester.test_payments_disabled()

    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("=" * 60)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())

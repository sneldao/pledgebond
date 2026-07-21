"""Shared test fixtures.

Patches the global `server.db` (and the lazily-imported `from server import db`
inside auth/payments/etc.) with an in-memory mongomock-motor client so the
full FastAPI app can be exercised end-to-end without a real MongoDB.
"""
import os
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Set required env vars BEFORE importing server (it reads them at import time).
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "pledgebond_test")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
os.environ.setdefault("CORS_ORIGINS", "*")

# Make backend/ importable
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from mongomock_motor import AsyncMongoMockClient  # noqa: E402

import server as server_module  # noqa: E402


@pytest.fixture
def mock_db():
    """A fresh in-memory async MongoDB per test."""
    client = AsyncMongoMockClient()
    db = client["pledgebond_test"]
    # Patch the module-level db that endpoints use directly.
    server_module.db = db
    return db


@pytest_asyncio.fixture
async def client(mock_db):
    """httpx AsyncClient bound to the FastAPI app with the mocked db."""
    transport = ASGITransport(app=server_module.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

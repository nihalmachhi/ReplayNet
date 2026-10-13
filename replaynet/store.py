import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4


class Store:
    def __init__(self, path: str):
        self.path = path
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS bundles (id TEXT PRIMARY KEY, sha256 TEXT, payload TEXT, created_at TEXT);
                CREATE TABLE IF NOT EXISTS specs (id TEXT PRIMARY KEY, payload TEXT, created_at TEXT);
                CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, payload TEXT, created_at TEXT);
                CREATE TABLE IF NOT EXISTS hypothesis_decisions (id TEXT PRIMARY KEY, hypothesis_id TEXT, payload TEXT, created_at TEXT);
            """)

    def connect(self):
        db = sqlite3.connect(self.path, check_same_thread=False)
        db.row_factory = sqlite3.Row
        return db

    def insert(self, table: str, identifier: str, payload: dict, created: str, digest: str = ""):
        if table not in {"bundles", "specs", "runs"}:
            raise ValueError("Unsupported table")
        with self.connect() as db:
            if table == "bundles":
                db.execute(
                    "INSERT INTO bundles VALUES (?, ?, ?, ?)",
                    (identifier, digest, json.dumps(payload), created),
                )
            else:
                db.execute(
                    f"INSERT INTO {table} VALUES (?, ?, ?)",
                    (identifier, json.dumps(payload), created),
                )

    def get(self, table: str, identifier: str):
        if table not in {"bundles", "specs", "runs"}:
            raise ValueError("Unsupported table")
        with self.connect() as db:
            row = db.execute(f"SELECT * FROM {table} WHERE id=?", (identifier,)).fetchone()
        if row is None:
            return None
        payload = json.loads(row["payload"])
        result = {"id": row["id"], **payload, "created_at": row["created_at"]}
        if table == "bundles":
            result["sha256"] = row["sha256"]
        return result

    def save_decision(self, hypothesis_id: str, payload: dict):
        identifier = str(uuid4())
        created = datetime.now(UTC).isoformat()
        with self.connect() as db:
            db.execute(
                "INSERT INTO hypothesis_decisions VALUES (?, ?, ?, ?)",
                (identifier, hypothesis_id, json.dumps(payload), created),
            )
        return {"id": identifier, "hypothesis_id": hypothesis_id, **payload, "created_at": created}

    def list(self, table: str):
        if table not in {"bundles", "specs", "runs"}:
            raise ValueError("Unsupported table")
        with self.connect() as db:
            ids = db.execute(f"SELECT id FROM {table} ORDER BY created_at DESC").fetchall()
        return [self.get(table, row["id"]) for row in ids]

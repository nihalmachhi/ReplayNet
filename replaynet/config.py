import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    database_path: str = os.getenv("REPLAYNET_DATABASE", "data/replaynet.sqlite3")
    viewer_token: str = os.getenv("REPLAYNET_VIEWER_TOKEN", "local-viewer-token")
    operator_token: str = os.getenv("REPLAYNET_OPERATOR_TOKEN", "local-operator-token")
    admin_token: str = os.getenv("REPLAYNET_ADMIN_TOKEN", "local-admin-token")
    max_bundle_bytes: int = 5 * 1024 * 1024




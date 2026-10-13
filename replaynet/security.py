import hmac
from enum import IntEnum

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from replaynet.config import Settings


class Role(IntEnum):
    viewer = 1
    operator = 2
    admin = 3


_bearer = HTTPBearer(auto_error=False)


def require_role(required: Role):
    def dependency(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> Role:
        if credentials is None:
            raise HTTPException(
                401, "Bearer token required", headers={"WWW-Authenticate": "Bearer"}
            )
        settings = Settings()
        tokens = (
            (settings.viewer_token, Role.viewer),
            (settings.operator_token, Role.operator),
            (settings.admin_token, Role.admin),
        )
        role = next(
            (r for token, r in tokens if hmac.compare_digest(credentials.credentials, token)), None
        )
        if role is None:
            raise HTTPException(401, "Invalid bearer token", headers={"WWW-Authenticate": "Bearer"})
        if role < required:
            raise HTTPException(403, "Insufficient role")
        return role

    return dependency

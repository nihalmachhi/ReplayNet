import re
from typing import Any

_SECRET = re.compile(
    r"(?i)(authorization|password|passwd|secret|token|api[_-]?key)\s*([:=])\s*([^\s,;]+)"
)
_EMAIL = re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")
_IPV4 = re.compile(r"(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])")


def redact_text(text: str) -> str:
    text = _SECRET.sub(lambda m: f"{m.group(1)}{m.group(2)}[REDACTED]", text)
    text = _EMAIL.sub("[REDACTED_EMAIL]", text)
    return _IPV4.sub("[REDACTED_IP]", text)


def redact(value: Any) -> Any:
    if isinstance(value, str):
        return redact_text(value)
    if isinstance(value, list):
        return [redact(item) for item in value]
    if isinstance(value, dict):
        return {
            str(k): "[REDACTED]"
            if re.search(r"(?i)(password|passwd|secret|token|api[_-]?key|authorization)", str(k))
            else redact(v)
            for k, v in value.items()
        }
    return value

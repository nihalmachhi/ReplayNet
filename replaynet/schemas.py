from typing import Literal

from pydantic import BaseModel, Field


class ScenarioSpec(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    fault: Literal["route_blackhole", "mtu_blackhole", "loss_during_failover"]
    build: Literal["buggy", "fixed"]
    parameters: dict[str, float | int | str | bool] = Field(default_factory=dict)
    event_ids: list[str] = Field(default_factory=list)
    oracle: str = Field(min_length=5, max_length=500)


class RunRequest(BaseModel):
    repetitions: int = Field(default=20, ge=1, le=100)
    seed: int = Field(default=7, ge=0, le=2**31 - 1)


class HypothesisDecision(BaseModel):
    status: Literal["confirmed", "rejected"]
    rationale: str = Field(min_length=5, max_length=500)

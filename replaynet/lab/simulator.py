import random

_FAILURE_RATE = {
    ("route_blackhole", "buggy"): 0.96,
    ("mtu_blackhole", "buggy"): 0.93,
    ("loss_during_failover", "buggy"): 0.91,
    ("route_blackhole", "fixed"): 0.01,
    ("mtu_blackhole", "fixed"): 0.02,
    ("loss_during_failover", "fixed"): 0.03,
}


def simulate(fault: str, build: str, seed: int) -> bool:
    """Run one seeded toy-lab trial; this is not a protocol emulator."""
    return random.Random(seed).random() < _FAILURE_RATE[(fault, build)]

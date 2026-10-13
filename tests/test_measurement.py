from replaynet.lab.simulator import simulate
from replaynet.measure.confidence import wilson_interval


def test_wilson_interval_contains_observed_rate():
    low, high = wilson_interval(9, 10)
    assert 0 <= low <= 0.9 <= high <= 1


def test_simulation_is_seeded_and_fixed_build_reduces_synthetic_failures():
    assert simulate("route_blackhole", "buggy", 10) == simulate("route_blackhole", "buggy", 10)
    buggy = sum(simulate("route_blackhole", "buggy", seed) for seed in range(1000))
    fixed = sum(simulate("route_blackhole", "fixed", seed) for seed in range(1000))
    assert buggy > 900 and fixed < 50

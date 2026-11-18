import { bundleForScenario, hypothesesForBundle, scenarioFor, FAULTS } from '../../data/fixtures';
import {
  runScenario,
  type Build,
  type Bundle,
  type Fault,
  type Hypothesis,
  type NormalizedEvent,
  type RunResult,
  type Scenario,
} from '../../lib/engine';

export const MIN_TRIALS = 5;
export const MAX_TRIALS = 100;
export const TRIAL_STEP = 5;
export const MAX_SEED = 2 ** 31 - 1;

export interface SimState {
  fault: Fault;
  build: Build;
  repetitions: number;
  seed: number;
  run: RunResult | null;
  selectedEventId: string | null;
}

export type SimAction =
  | { type: 'fault'; fault: Fault }
  | { type: 'build'; build: Build }
  | { type: 'repetitions'; repetitions: number }
  | { type: 'seed'; seed: number }
  | { type: 'run' }
  | { type: 'reset' }
  | { type: 'select'; eventId: string };

export const initialSimState: SimState = {
  fault: 'route_blackhole',
  build: 'buggy',
  repetitions: 20,
  seed: 7,
  run: null,
  selectedEventId: null,
};

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, Math.trunc(value)));
}

/** Simulator state is a reducer so every control produces one predictable change. */
export function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'fault':
      return {
        ...state,
        fault: action.fault,
        run: null,
        selectedEventId: null,
      };
    case 'build':
      return {
        ...state,
        build: action.build,
        run: null,
        selectedEventId: null,
      };
    case 'repetitions':
      return {
        ...state,
        repetitions: clamp(action.repetitions, MIN_TRIALS, MAX_TRIALS),
        run: null,
      };
    case 'seed':
      return {
        ...state,
        seed: clamp(action.seed, 0, MAX_SEED),
        run: null,
      };
    case 'run': {
      const scenario = currentScenario(state);
      return {
        ...state,
        run: runScenario(scenario, state.repetitions, state.seed),
        selectedEventId: scenario.eventIds[0] ?? null,
      };
    }
    case 'reset':
      return { ...initialSimState };
    case 'select':
      return { ...state, selectedEventId: action.eventId };
    default:
      return state;
  }
}

export function currentScenario(state: SimState): Scenario {
  return scenarioFor(state.fault, state.build);
}

export function currentBundle(state: SimState): Bundle {
  return bundleForScenario(currentScenario(state));
}

export function selectedEvent(state: SimState): NormalizedEvent | null {
  if (!state.selectedEventId) return null;
  return currentBundle(state).events.find((event) => event.id === state.selectedEventId) ?? null;
}

export function currentHypotheses(state: SimState): Hypothesis[] {
  return hypothesesForBundle(currentBundle(state));
}

export interface ComparisonRow {
  fault: Fault;
  buggy: RunResult;
  fixed: RunResult;
}

/** All six scenarios at the current seed and repetition count. */
export function comparisonRows(repetitions: number, seed: number): ComparisonRow[] {
  return FAULTS.map((fault) => ({
    fault,
    buggy: runScenario(scenarioFor(fault, 'buggy'), repetitions, seed),
    fixed: runScenario(scenarioFor(fault, 'fixed'), repetitions, seed),
  }));
}

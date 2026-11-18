import type { Build, Fault } from '../../lib/engine';
import { BUILD_LABEL, FAULT_LABEL } from '../../lib/format';
import { FAULTS } from '../../data/fixtures';
import { MAX_SEED, MAX_TRIALS, MIN_TRIALS, TRIAL_STEP } from './model';

interface ControlsProps {
  fault: Fault;
  build: Build;
  repetitions: number;
  seed: number;
  onFault: (fault: Fault) => void;
  onBuild: (build: Build) => void;
  onRepetitions: (repetitions: number) => void;
  onSeed: (seed: number) => void;
  onRun: () => void;
  onReset: () => void;
}

const BUILDS: Build[] = ['buggy', 'fixed'];

export function Controls({
  fault,
  build,
  repetitions,
  seed,
  onFault,
  onBuild,
  onRepetitions,
  onSeed,
  onRun,
  onReset,
}: ControlsProps) {
  return (
    <div className="ctl">
      <label className="field">
        Fault
        <select
          value={fault}
          onChange={(event) => onFault(event.target.value as Fault)}
          aria-label="Fault"
        >
          {FAULTS.map((item) => (
            <option value={item} key={item}>
              {FAULT_LABEL[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Build
        <select
          value={build}
          onChange={(event) => onBuild(event.target.value as Build)}
          aria-label="Build"
        >
          {BUILDS.map((item) => (
            <option value={item} key={item}>
              {BUILD_LABEL[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Trials
        <input
          type="range"
          id="trial-count"
          min={MIN_TRIALS}
          max={MAX_TRIALS}
          step={TRIAL_STEP}
          value={repetitions}
          aria-label="Trials"
          onChange={(event) => onRepetitions(Number(event.target.value))}
        />
        <output htmlFor="trial-count">{repetitions}</output>
      </label>
      <label className="field">
        Seed
        <input
          type="number"
          min={0}
          max={MAX_SEED}
          step={1}
          value={seed}
          aria-label="Seed"
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onSeed(next);
          }}
        />
      </label>
      <button className="pill w" type="button" onClick={onRun}>
        Replay scenario
      </button>
      <button className="pill" type="button" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

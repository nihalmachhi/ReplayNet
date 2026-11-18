import type { RunResult } from '../../lib/engine';

/**
 * A compact bit string for the run: one square per trial, orange when the
 * fault reproduced. The list is labelled so a screen reader gets the same
 * information without relying on colour.
 */
export function TrialStrip({ run }: { run: RunResult | null }) {
  if (!run) {
    return <p className="empty">Run the scenario to see each trial.</p>;
  }
  return (
    <div className="trialwrap">
      <ol className="trials" aria-label="Trial outcomes, 1 means the fault reproduced">
        {run.trials.map((failed, index) => (
          <li
            className={`trial ${failed ? 'no' : 'ok'}`}
            key={index}
            aria-label={`Trial ${index + 1}: ${failed ? 'reproduced' : 'passed'}`}
          />
        ))}
      </ol>
      <p className="trialnote">
        {run.failureCount} of {run.repetitions} trials reproduced the fault · seed {run.seed}
      </p>
    </div>
  );
}

import { useReducer } from 'react';
import type { CSSProperties } from 'react';
import { HEADINGS, TRY_LEAD } from '../data/content';
import { VERDICT_LABEL, VERDICT_TONE } from '../lib/format';
import { Icon } from './Icon';
import { CompareTable } from './simulator/CompareTable';
import { Controls } from './simulator/Controls';
import { DetailPanel } from './simulator/DetailPanel';
import { StatsRow } from './simulator/StatsRow';
import { Timeline } from './simulator/Timeline';
import { TrialStrip } from './simulator/TrialStrip';
import {
  currentBundle,
  currentHypotheses,
  initialSimState,
  selectedEvent,
  simReducer,
} from './simulator/model';

export function Simulator() {
  const [state, dispatch] = useReducer(simReducer, initialSimState);
  const bundle = currentBundle(state);
  const event = selectedEvent(state);
  const hypotheses = currentHypotheses(state);

  const chipClass = state.run ? `chip ${VERDICT_TONE[state.run.verdict]}` : 'chip';
  const chipText = state.run
    ? `${VERDICT_LABEL[state.run.verdict]} · ${state.run.failureCount}/${state.run.repetitions} failed`
    : 'no run yet';

  const heading = HEADINGS.try;
  return (
    <section className="sec" id="try">
      <h2>
        {heading.lead}{' '}
        <span className="m">
          <i className="ico" style={{ '--c': heading.color } as CSSProperties}>
            <Icon name={heading.icon} />
          </i>{' '}
          {heading.trail}
        </span>
      </h2>
      <p className="lead2">{TRY_LEAD}</p>

      <div className="sim" id="sim">
        <div className="shead">
          <span>deterministic lab · synthetic incidents</span>
          <span className={chipClass} aria-live="polite">
            {chipText}
          </span>
        </div>
        <StatsRow run={state.run} repetitions={state.repetitions} seed={state.seed} />
        <Controls
          fault={state.fault}
          build={state.build}
          repetitions={state.repetitions}
          seed={state.seed}
          onFault={(fault) => dispatch({ type: 'fault', fault })}
          onBuild={(build) => dispatch({ type: 'build', build })}
          onRepetitions={(repetitions) => dispatch({ type: 'repetitions', repetitions })}
          onSeed={(seed) => dispatch({ type: 'seed', seed })}
          onRun={() => dispatch({ type: 'run' })}
          onReset={() => dispatch({ type: 'reset' })}
        />
        <TrialStrip run={state.run} />
        <div className="scols">
          <Timeline
            bundle={bundle}
            selectedId={state.selectedEventId}
            onSelect={(eventId) => dispatch({ type: 'select', eventId })}
          />
          <DetailPanel event={event} hypotheses={hypotheses} />
        </div>
        <CompareTable repetitions={state.repetitions} seed={state.seed} />
      </div>
    </section>
  );
}

import type { Hypothesis, NormalizedEvent } from '../../lib/engine';
import { formatTimestamp } from '../../lib/format';

interface DetailPanelProps {
  event: NormalizedEvent | null;
  hypotheses: Hypothesis[];
}

export function DetailPanel({ event, hypotheses }: DetailPanelProps) {
  return (
    <div>
      <h3>Selected event</h3>
      {event ? (
        <dl className="evp-dl">
          <dt>ID</dt>
          <dd>{event.id}</dd>
          <dt>Timestamp</dt>
          <dd>{formatTimestamp(event.timestamp)}</dd>
          <dt>Source</dt>
          <dd>{event.source}</dd>
          <dt>Kind</dt>
          <dd>{event.kind}</dd>
          <dt>Message</dt>
          <dd>{event.message}</dd>
          <dt>Measured</dt>
          <dd>{event.measured ? 'yes' : 'no'}</dd>
          <dt>Uncertainty</dt>
          <dd>{event.uncertainty_ms} ms</dd>
        </dl>
      ) : (
        <p className="empty">Run a scenario, then pick an event to see its normalized fields.</p>
      )}

      <h3 className="hyhead">Hypotheses</h3>
      {hypotheses.length === 0 ? (
        <p className="empty">No event-kind rule matched this bundle.</p>
      ) : (
        <ul className="hyps">
          {hypotheses.map((item) => (
            <li key={item.id}>
              <b>{item.title}</b>
              <span className="k">{item.rule}</span>
              <p>Supporting events: {item.supportingEventIds.join(', ')}</p>
              <p className="ms">{item.method}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

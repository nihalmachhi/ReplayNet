import type { Bundle } from '../../lib/engine';
import { formatTimestamp } from '../../lib/format';

interface TimelineProps {
  bundle: Bundle;
  selectedId: string | null;
  onSelect: (eventId: string) => void;
}

export function Timeline({ bundle, selectedId, onSelect }: TimelineProps) {
  return (
    <div>
      <h3>Timeline</h3>
      <p className="trialnote">
        {bundle.events.length} normalized events · {bundle.source}
      </p>
      <ol className="tline">
        {bundle.events.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              className={`evt ${event.measured ? 'ok' : 'mu'}`}
              aria-pressed={selectedId === event.id}
              onClick={() => onSelect(event.id)}
            >
              <span className="t">{formatTimestamp(event.timestamp)}</span>
              <span className="k">{event.kind}</span>
              <span className="ms">{event.id}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

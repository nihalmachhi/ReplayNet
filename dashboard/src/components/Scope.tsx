import type { CSSProperties } from 'react';
import { HEADINGS, SCOPE_IN, SCOPE_OUT } from '../data/content';
import { Icon } from './Icon';

export function Scope() {
  const heading = HEADINGS.scope;
  return (
    <section className="sec" id="scope">
      <h2>
        {heading.lead}{' '}
        <i className="ico" style={{ '--c': heading.color } as CSSProperties}>
          <Icon name={heading.icon} />
        </i>{' '}
        <span className="m">{heading.trail}</span>
      </h2>
      <p className="lead2">
        ReplayNet is for learning how to turn incident evidence into a repeatable test. It is not a
        traffic generator, a protocol emulator or a production monitor.
      </p>
      <div className="sc">
        <div className="scc">
          <div className="ib" style={{ '--c': '#22c55e' } as CSSProperties}>
            <Icon name="check" />
          </div>
          <h3>In scope</h3>
          <ul>
            {SCOPE_IN.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="scc">
          <div className="ib" style={{ '--c': '#ef4444' } as CSSProperties}>
            <Icon name="x" />
          </div>
          <h3>Out of scope</h3>
          <ul>
            {SCOPE_OUT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

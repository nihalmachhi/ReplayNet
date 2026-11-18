import type { CSSProperties } from 'react';
import { HEADINGS, QUICK_STEPS } from '../data/content';
import { Icon } from './Icon';

export function QuickStart() {
  const heading = HEADINGS.start;
  return (
    <section className="sec" id="start">
      <h2>
        {heading.lead}{' '}
        <span className="m">
          <i className="ico" style={{ '--c': heading.color } as CSSProperties}>
            <Icon name={heading.icon} />
          </i>{' '}
          {heading.trail}
        </span>
      </h2>
      <p className="lead2">
        Python 3.11 or newer, uv, and nothing else. The API binds to 127.0.0.1 and the demo tokens
        are not secrets.
      </p>
      <div className="steps qs">
        {QUICK_STEPS.map((step) => (
          <div className="step" key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            <div className="code">
              {step.code.map((line, index) => (
                <div key={`${line.text}-${index}`}>
                  {line.comment ? <span className="c">{line.text}</span> : line.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

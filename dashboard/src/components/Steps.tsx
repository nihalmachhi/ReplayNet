import type { CSSProperties } from 'react';
import { HEADINGS, HOW_LEAD, STEPS } from '../data/content';
import { Icon } from './Icon';

export function Steps() {
  const heading = HEADINGS.how;
  return (
    <section className="sec" id="how">
      <h2>
        {heading.lead}{' '}
        <span className="m">
          <i className="ico" style={{ '--c': heading.color } as CSSProperties}>
            <Icon name={heading.icon} />
          </i>{' '}
          {heading.trail}
        </span>
      </h2>
      <p className="lead2">{HOW_LEAD}</p>
      <div className="steps">
        {STEPS.map((step) => (
          <div className="step" key={step.title}>
            <div className="ib" style={{ '--c': step.color } as CSSProperties}>
              <Icon name={step.icon} />
            </div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            {step.mini.kind === 'lines' ? (
              <div className="mini">
                {step.mini.lines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ) : null}
            {step.mini.kind === 'dots' ? (
              <div className="mini">
                <div>
                  {step.mini.dots.map((dot, index) => (
                    <span className={`dot ${dot === 'bad' ? 'r' : ''}`} key={index} />
                  ))}
                </div>
                {step.mini.line}
              </div>
            ) : null}
            {step.mini.kind === 'seg' ? (
              <div className="mini">
                <div className="seg">
                  {step.mini.segments.map((segment) => (
                    <b
                      key={segment.label}
                      style={{ flex: segment.flex, background: segment.color }}
                    >
                      {segment.label}
                    </b>
                  ))}
                </div>
                {step.mini.note}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

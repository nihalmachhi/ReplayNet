import type { CSSProperties } from 'react';
import { BENTO, HEADINGS } from '../data/content';
import { Icon } from './Icon';

export function Bento() {
  const heading = HEADINGS.features;
  return (
    <section className="sec" id="features">
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
        Every stage is small enough to read, run and test on its own, from the redaction regexes to
        the seeded random draw.
      </p>
      <div className="bento">
        {BENTO.map((card) => (
          <div
            className={`bc ${card.size === 'wide' ? 'w' : ''} ${card.size === 'full' ? 'f' : ''}`}
            key={card.title}
          >
            <div className="ib" style={{ '--c': card.color } as CSSProperties}>
              <Icon name={card.icon} />
            </div>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            {card.mini ? (
              <div className="mini">
                {card.mini.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ) : null}
            {card.tags ? (
              <div className="tags">
                {card.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

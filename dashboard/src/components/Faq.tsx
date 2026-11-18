import type { CSSProperties } from 'react';
import { FAQ, HEADINGS } from '../data/content';
import { Icon } from './Icon';

export function Faq() {
  const heading = HEADINGS.faq;
  return (
    <section className="sec" id="faq">
      <h2>
        {heading.lead}{' '}
        <i className="ico" style={{ '--c': heading.color } as CSSProperties}>
          <Icon name={heading.icon} />
        </i>{' '}
        <span className="m">{heading.trail}</span>
      </h2>
      <div className="faq">
        {FAQ.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

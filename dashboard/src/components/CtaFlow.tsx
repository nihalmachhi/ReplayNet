import type { CSSProperties } from 'react';
import { CTA, CTA_NODES } from '../data/content';
import { Icon } from './Icon';
import { Reveal } from './Reveal';

const WIDTH = 132;
const GAP = 30;
const START = 0;

export function CtaFlow() {
  return (
    <Reveal className="cta2" ariaLabel="Get started">
      <div className="rv archw" style={{ '--r': 0 } as CSSProperties}>
        <svg
          className="flow arch"
          viewBox="0 0 964 90"
          role="img"
          aria-label="ReplayNet pipeline: incident evidence, redaction, UTC normalization, a seeded replay, a Wilson 95% interval and a verdict"
        >
          {CTA_NODES.slice(0, -1).map((_, index) => {
            const from = START + index * (WIDTH + GAP) + WIDTH;
            return <path className="fl" key={index} d={`M${from} 45H${from + GAP}`} />;
          })}
          {CTA_NODES.map((node, index) => {
            const x = START + index * (WIDTH + GAP);
            const centre = x + WIDTH / 2;
            const delay = index * 0.9;
            return (
              <g
                className={`gn st ${node.hub ? 'hub' : ''} ${index === CTA_NODES.length - 1 ? 'last' : ''}`}
                key={node.label.join(' ')}
                style={{ '--d': `${delay}s` } as CSSProperties}
              >
                <rect x={x} y={12} width={WIDTH} height={66} rx={9} />
                <text textAnchor="middle">
                  {node.label.map((line, lineIndex) => (
                    <tspan x={centre} y={42 + lineIndex * 13} key={line}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
          <text className="out-a" x={846} y={87} textAnchor="middle">
            guarded
          </text>
          <text className="out-b" x={906} y={87} textAnchor="middle">
            reproduced
          </text>
          <circle r="3.2" fill="#f4f4f5">
            <animateMotion
              dur="6.3s"
              repeatCount="indefinite"
              path={`M0 45H${START + (CTA_NODES.length - 1) * (WIDTH + GAP) + WIDTH}`}
            />
          </circle>
        </svg>
      </div>
      <h2 className="rv" style={{ '--r': 1 } as CSSProperties}>
        {CTA.heading}
        <br />
        <span className="m">
          <i className="ico pulse" style={{ '--c': '#ef4444' } as CSSProperties}>
            <Icon name="alert" />
          </i>{' '}
          {CTA.trail}
        </span>
      </h2>
      <div className="btns rv" style={{ '--r': 2 } as CSSProperties}>
        {CTA.ctas.map((cta) => (
          <a
            className={`pill ${cta.variant === 'w' ? 'w' : ''}`}
            href={cta.href}
            key={cta.label}
            {...(cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {cta.label}
          </a>
        ))}
      </div>
    </Reveal>
  );
}

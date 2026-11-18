import type { AnimationEvent, CSSProperties, FocusEvent, KeyboardEvent } from 'react';
import { useRef } from 'react';
import { TOUR_SIDEBAR, TOUR_TABS, type TourBlock } from '../data/tour';
import type { TourState } from '../hooks/useTour';

function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, index) =>
        index % 2 === 1 ? <b key={index}>{part}</b> : <span key={index}>{part}</span>,
      )}
    </>
  );
}

function Block({ block, index }: { block: TourBlock; index: number }) {
  const style = { '--i': index } as CSSProperties;
  switch (block.type) {
    case 'p':
      return (
        <p className="tx rise" style={{ ...style, ...(block.muted ? { color: 'var(--mu)' } : {}) }}>
          {block.text}
        </p>
      );
    case 'sp':
      return (
        <>
          {block.rows.map((row, rowIndex) => (
            <div
              className="sp-r rise"
              key={`${row.name}-${rowIndex}`}
              style={{ ...style, marginLeft: (row.indent ?? 0) * 22 }}
            >
              <span className={`k ${row.tag}`}>{row.tag}</span>
              {row.name}
              {row.meta ? <span className="ms">{row.meta}</span> : null}
            </div>
          ))}
        </>
      );
    case 'rw':
      return (
        <>
          {block.rows.map((row, rowIndex) => (
            <div className="rw rise" key={`${row.key}-${rowIndex}`} style={style}>
              <span>{row.key}</span>
              {row.replacement ? (
                <span className="v" style={style}>
                  <s>{row.value}</s>
                  <b>{row.replacement}</b>
                </span>
              ) : (
                <span>{row.value}</span>
              )}
            </div>
          ))}
        </>
      );
    case 'chips':
      return (
        <p>
          {block.chips.map((chip) => (
            <span className={`chip ${chip.tone} rise`} key={chip.label} style={style}>
              {chip.label}
            </span>
          ))}
        </p>
      );
    case 'term':
      return (
        <div className="term rise" style={style}>
          {block.lines.map((line, lineIndex) => (
            <div key={`${line}-${lineIndex}`}>{line}</div>
          ))}
        </div>
      );
    case 'list':
      return (
        <ul className="lst">
          {block.items.map((item) => (
            <li className="rise" key={item} style={style}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      );
    case 'asset':
      return (
        <>
          {block.rows.map((row) => (
            <div className="rw rise" key={row.key} style={style}>
              <span>{row.key}</span>
              <span>
                {row.value}
                {row.note ? <span className="ms">{row.note}</span> : null}
              </span>
            </div>
          ))}
        </>
      );
    case 'note':
      return (
        <p className="tx rise" style={{ ...style, color: 'var(--mu)', fontSize: '.84rem' }}>
          {block.text}
        </p>
      );
    default:
      return null;
  }
}

export function TourWindow({ tour }: { tour: TourState }) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = TOUR_TABS[tour.index];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next = tour.index;
    if (event.key === 'ArrowRight') next = (tour.index + 1) % TOUR_TABS.length;
    else if (event.key === 'ArrowLeft') next = (tour.index - 1 + TOUR_TABS.length) % TOUR_TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TOUR_TABS.length - 1;
    else return;
    event.preventDefault();
    tour.show(next);
    tabRefs.current[next]?.focus();
  };

  const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).classList.contains('bar')) tour.onBarEnd();
  };

  const onFocus = () => tour.setHold(true);
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) tour.setHold(false);
  };

  return (
    <>
      <div className="tabs">
        <div
          className="tl"
          role="tablist"
          aria-label="What ReplayNet does"
          tabIndex={-1}
          onKeyDown={onKeyDown}
          onAnimationEnd={onAnimationEnd}
          onFocus={onFocus}
          onBlur={onBlur}
          onMouseEnter={() => tour.setHold(true)}
          onMouseLeave={() => tour.setHold(false)}
        >
          {TOUR_TABS.map((tab, index) => (
            <button
              className="tab"
              key={tab.tab}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              role="tab"
              id={`tour-tab-${index}`}
              aria-selected={index === tour.index}
              aria-controls="tour-panel"
              tabIndex={index === tour.index ? 0 : -1}
              onClick={() => {
                if (index !== tour.index) tour.show(index);
              }}
            >
              {tab.tab}
              {index === tour.index ? <i className="bar" /> : null}
            </button>
          ))}
        </div>
        <button
          className="ctrl"
          type="button"
          aria-label={tour.paused ? 'Resume the automatic tour' : 'Pause the automatic tour'}
          title={tour.paused ? 'Resume' : 'Pause'}
          onClick={tour.togglePause}
        >
          {tour.paused ? '▶' : '❚❚'}
        </button>
      </div>

      <div
        className="win"
        ref={tour.winRef}
        style={{ textAlign: 'left' }}
        onMouseEnter={() => tour.setHold(true)}
        onMouseLeave={() => tour.setHold(false)}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <aside className="side" aria-hidden="true">
          <div className="dots">
            <i />
            <i />
            <i />
          </div>
          {TOUR_SIDEBAR.items.map((item) => (
            <div className={`it ${item.on ? 'on' : ''}`} key={item.label}>
              {item.label} <span>{item.count}</span>
            </div>
          ))}
          {TOUR_SIDEBAR.groups.map((group) => (
            <div key={group.title}>
              <h4>{group.title}</h4>
              {group.items.map((item) => (
                <div
                  className="it f"
                  key={item.label}
                  style={{ '--c': item.tone === 'ok' ? 'var(--ok)' : item.tone === 'no' ? 'var(--bad)' : '#62626b' } as CSSProperties}
                >
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </aside>

        <div
          className={`main ${tour.out ? 'out' : ''}`}
          id="tour-panel"
          role="tabpanel"
          aria-live="off"
          aria-labelledby={`tour-tab-${tour.index}`}
        >
          <div className="body">
            <div className="col cv">
              <h3>{active.heading}</h3>
              <div className="sub">{active.sub}</div>
              {active.main.map((block, index) => (
                <Block block={block} index={index} key={`${block.type}-${index}`} />
              ))}
            </div>
            <div className="col cv">
              <h4 className="rise">{active.asideHeading}</h4>
              {active.aside.map((block, index) => (
                <Block block={block} index={index + 1} key={`${block.type}-${index}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { HERO } from '../data/content';
import { TOUR_TABS } from '../data/tour';
import { useTour } from '../hooks/useTour';
import { TourWindow } from './TourWindow';

export function Hero() {
  const tour = useTour(TOUR_TABS.length);
  return (
    <header className={`hero ${tour.holdActive ? 'hold' : ''}`} id="top">
      <h1>{HERO.h1}</h1>
      <p>{HERO.p}</p>
      <div className="cta">
        {HERO.ctas.map((cta) => (
          <a
            key={cta.label}
            className={`pill ${cta.variant === 'w' ? 'w' : ''}`}
            href={cta.href}
            {...(cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {cta.label}
          </a>
        ))}
      </div>
      <h2 className="sr-only">Product tour</h2>
      <TourWindow tour={tour} />
    </header>
  );
}

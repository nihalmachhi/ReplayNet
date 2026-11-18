import type { SVGProps } from 'react';

export type IconName =
  | 'check'
  | 'alert'
  | 'bars'
  | 'cube'
  | 'lightbulb'
  | 'question'
  | 'shield'
  | 'code'
  | 'key'
  | 'link'
  | 'filter'
  | 'database'
  | 'lock'
  | 'x'
  | 'arrow';

const PATHS: Record<IconName, string[]> = {
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  alert: ['M12 8v5', 'M12 17h.01'],
  bars: ['M7 19v-6', 'M12 19V6', 'M17 19v-10'],
  cube: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M12 12l8-4.5', 'M12 12v9', 'M12 12L4 7.5'],
  lightbulb: [
    'M9 18h6',
    'M10 21h4',
    'M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z',
  ],
  question: ['M9.5 9a2.6 2.6 0 115 .6c0 1.8-2.5 2.2-2.5 4', 'M12 17.5h.01'],
  shield: ['M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z'],
  code: ['M8 8l-4 4 4 4', 'M16 8l4 4-4 4'],
  key: ['M14 7a4 4 0 10-3.5 6L4 19v2h3l1-1v-2h2v-2h2l1.5-1.5A4 4 0 0014 7z'],
  link: [
    'M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1',
    'M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1',
  ],
  filter: ['M4 5h16', 'M7 12h10', 'M10 19h4'],
  database: [
    'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3z',
    'M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6',
    'M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6',
  ],
  lock: ['M7 11V8a5 5 0 0110 0v3', 'M5 11h14v10H5z'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  arrow: ['M5 12h14', 'M13 6l6 6-6 6'],
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      {PATHS[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

/** The three-bar brand mark, with the third bar offset and orange. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      <rect x="2" y="3" width="18" height="3.4" rx="1.7" fill="#f4f4f5" />
      <rect x="6" y="9.3" width="14" height="3.4" rx="1.7" fill="#8c8c95" />
      <rect x="10" y="15.6" width="10" height="3.4" rx="1.7" fill="#ff7a45" />
    </svg>
  );
}

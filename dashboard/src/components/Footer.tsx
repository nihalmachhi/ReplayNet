import { FOOTER_COLUMNS, SITE } from '../data/content';
import { BrandMark } from './Icon';

export function Footer() {
  return (
    <footer className="wrap">
      <div className="foot">
        <div className="fcols">
          <div>
            <a className="brand" href="#top">
              <BrandMark />
              {SITE.name}
            </a>
            <p className="tg">{SITE.tagline}</p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="fbot">
          <span>{SITE.disclaimer}</span>
          <span>{SITE.stack}</span>
        </div>
        <div className="mark" aria-hidden="true">
          {SITE.name}
        </div>
      </div>
    </footer>
  );
}

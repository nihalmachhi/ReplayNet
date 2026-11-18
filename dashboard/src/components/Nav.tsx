import { NAV_LINKS, SITE } from '../data/content';
import { BrandMark } from './Icon';

export function Nav() {
  return (
    <nav className="top" aria-label="Main">
      <a className="brand" href="#top">
        <BrandMark />
        {SITE.name}
      </a>
      <div className="links">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
      <div className="sp">
        <a className="pill" href={SITE.repo} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a className="pill w" href="#start">
          Run it locally
        </a>
      </div>
    </nav>
  );
}

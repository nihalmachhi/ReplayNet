import { Bento } from './components/Bento';
import { CtaFlow } from './components/CtaFlow';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Nav } from './components/Nav';
import { QuickStart } from './components/QuickStart';
import { Results } from './components/Results';
import { Scope } from './components/Scope';
import { Simulator } from './components/Simulator';
import { Steps } from './components/Steps';

export function App() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="wrap">
        <Nav />
        <Hero />
        <main id="main">
          <Steps />
          <Simulator />
          <Results />
          <Bento />
          <QuickStart />
          <Scope />
          <Faq />
          <CtaFlow />
        </main>
      </div>
      <Footer />
    </>
  );
}

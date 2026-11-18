/**
 * WHAT YOU WILL LEARN
 * - How to guard a content-heavy site against anchor rot and unsafe links.
 * - How to enforce the "no dangerouslySetInnerHTML" rule with a test, not trust.
 * - Which phrases this project deliberately avoids.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { BENTO, CTA_NODES, FAQ, NAV_LINKS, QUICK_STEPS, SCOPE_IN, SCOPE_OUT } from '../data/content';

const BANNED = ['production-ready', 'enterprise-grade', 'AI-powered', '100% secure'];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

describe('content guards', () => {
  it('resolves every in-page anchor to a real element id', () => {
    render(<App />);
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      expect(document.querySelector(anchor.getAttribute('href') ?? ''), anchor.href).not.toBeNull();
    }
  });

  it('resolves every navigation link', () => {
    render(<App />);
    for (const link of NAV_LINKS) {
      expect(document.querySelector(link.href), link.label).not.toBeNull();
    }
  });

  it('marks every external link noopener noreferrer', () => {
    render(<App />);
    const external = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]'));
    expect(external.length).toBeGreaterThan(0);
    for (const anchor of external) {
      expect(anchor.getAttribute('rel'), anchor.href).toBe('noopener noreferrer');
    }
  });

  it('contains none of the banned marketing phrases', () => {
    render(<App />);
    const text = (document.body.textContent ?? '').toLowerCase();
    for (const phrase of BANNED) {
      expect(text, phrase).not.toContain(phrase);
    }
  });

  it('never uses dangerouslySetInnerHTML in source files', () => {
    const files = sourceFiles(resolve(process.cwd(), 'src'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toContain('dangerouslySetInnerHTML');
    }
  });

  it('renders nine FAQ items with unique questions', () => {
    render(<App />);
    expect(screen.getAllByText(/.+/, { selector: 'summary' })).toHaveLength(FAQ.length);
    expect(FAQ).toHaveLength(9);
    expect(new Set(FAQ.map((item) => item.question)).size).toBe(9);
  });

  it('keeps the page anatomy the reference expects', () => {
    expect(NAV_LINKS).toHaveLength(6);
    expect(BENTO).toHaveLength(8);
    expect(QUICK_STEPS).toHaveLength(3);
    expect(CTA_NODES).toHaveLength(6);
    expect(SCOPE_IN.length).toBeGreaterThan(0);
    expect(SCOPE_OUT.length).toBeGreaterThan(0);
  });
});

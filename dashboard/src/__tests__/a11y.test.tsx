/**
 * WHAT YOU WILL LEARN
 * - How to run axe-core over the whole page, not just one component.
 * - Why roles, labels and landmark structure matter even in a marketing page.
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { App } from '../App';

describe('accessibility', () => {
  it('has no axe violations on the full page', async () => {
    const { container } = render(<App />);
    // jsdom has no canvas, so axe cannot compute colour contrast here.
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results).toHaveNoViolations();
  });
});

/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars */
import type { AxeMatchers } from 'vitest-axe';

declare module 'vitest' {
  // The matcher package augments the old global `Vi` namespace; Vitest 2 reads
  // the module-scoped interfaces instead.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

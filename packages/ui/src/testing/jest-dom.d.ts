import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module '@rstest/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merge
  interface Matchers<T> extends TestingLibraryMatchers<unknown, T> {}
}

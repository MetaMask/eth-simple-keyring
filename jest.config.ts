/* eslint-disable node/no-extraneous-import */
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  collectCoverage: true,
  coverageReporters: ['text', 'html'],
  coverageThreshold: {
    global: {
      branches: 81,
      functions: 100,
      lines: 95,
      statements: 95,
    },
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  // "resetMocks" resets all mocks, including mocked modules, to jest.fn(),
  // between each test case.
  resetMocks: true,
  // "restoreMocks" restores all mocks created using jest.spyOn to their
  // original implementations, between each test. It does not affect mocked
  // modules.
  restoreMocks: true,
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.ts', '**/test/**/*.js'],
  testTimeout: 2500,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};

export default config;

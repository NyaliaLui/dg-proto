import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  globals: {
    IS_REACT_ACT_ENVIRONMENT: true,
  },
  testPathIgnorePatterns: ['<rootDir>/tests/component/utils/'],
  testMatch: ['**/tests/component/*.tsx'],
};

// Override transformIgnorePatterns after next/jest resolves to ensure ESM deps are transpiled
const jestConfig = async () => {
  const nextConfig = await createJestConfig(config)();
  return {
    ...nextConfig,
    transformIgnorePatterns: [
      'node_modules/(?!(debounce|flowbite-react)/)',
      '^.+\\.module\\.(css|sass|scss)$',
    ],
  };
};

export default jestConfig;

// @ts-check

const nextJest = require('next/jest')

// @ts-expect-error: next/jest is not callable
const createJestConfig = nextJest({dir: './'})

/**
 * @type {import('jest').Config}
 **/
const customJestConfig = {
  moduleDirectories: ['node_modules', '<rootDir>/'],
  extensionsToTreatAsEsm: ['.ts'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

module.exports = {
  displayName: 'platform-subscription',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/platform/subscription',
  moduleNameMapper: {
    '^@kodem/contracts$': '<rootDir>/../../contracts/src/index.ts',
    '^@kodem/database$': '<rootDir>/../../database/src/index.ts',
  },
};

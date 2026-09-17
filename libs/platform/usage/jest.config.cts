module.exports = {
  displayName: 'platform-usage',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/platform/usage',
  moduleNameMapper: {
    '^@kodem/contracts$': '<rootDir>/../../contracts/src/index.ts',
    '^@kodem/database$': '<rootDir>/../../database/src/index.ts',
    '^@kodem/platform/subscription$':
      '<rootDir>/../subscription/src/index.ts',
  },
};

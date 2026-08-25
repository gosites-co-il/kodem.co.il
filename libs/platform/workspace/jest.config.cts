module.exports = {
  displayName: 'platform-workspace',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/platform/workspace',
  moduleNameMapper: {
    '^@kodem/contracts$': '<rootDir>/../../contracts/src/index.ts',
  },
};

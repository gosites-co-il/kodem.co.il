module.exports = {
  displayName: 'platform-auth',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/platform/auth',
  moduleNameMapper: {
    '^@kodem/contracts$': '<rootDir>/../../contracts/src/index.ts',
    '^@kodem/platform/permissions$':
      '<rootDir>/../permissions/src/index.ts',
  },
};

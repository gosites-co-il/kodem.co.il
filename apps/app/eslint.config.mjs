import nextVitals from 'eslint-config-next/core-web-vitals';
import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

const eslintConfig = [
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  ...nextVitals,
  {
    ignores: ['.next/**/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Next 16 ships react-hooks v7; this rule flags common data-loading effects.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default eslintConfig;

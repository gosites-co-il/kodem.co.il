import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      'libs/database/src/generated/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:events',
                'scope:platform',
                'scope:workspace',
                'scope:module',
                'scope:engine',
                'scope:integration',
                'scope:database',
                'scope:shared',
                'scope:design-system',
              ],
            },
            {
              sourceTag: 'scope:web',
              notDependOnLibsWithTags: ['scope:engine', 'scope:database'],
            },
            {
              sourceTag: 'scope:marketing',
              onlyDependOnLibsWithTags: [
                'scope:shared',
                'scope:platform',
                'scope:design-system',
                'scope:contracts',
              ],
            },
            {
              sourceTag: 'scope:api',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:events',
                'scope:platform',
                'scope:workspace',
                'scope:module',
                'scope:engine',
                'scope:integration',
                'scope:database',
                'scope:shared',
                'scope:design-system',
              ],
            },
            {
              sourceTag: 'scope:worker',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:events',
                'scope:platform',
                'scope:workspace',
                'scope:engine',
                'scope:integration',
                'scope:database',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:contracts',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:events',
              onlyDependOnLibsWithTags: ['scope:contracts', 'scope:shared'],
            },
            {
              sourceTag: 'scope:platform',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:platform',
                'scope:shared',
                'scope:engine',
                'scope:events',
                'scope:workspace',
                'scope:database',
              ],
            },
            {
              sourceTag: 'scope:workspace',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:events',
                'scope:platform',
                'scope:workspace',
                'scope:shared',
                'scope:engine',
              ],
            },
            {
              sourceTag: 'scope:module',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:events',
                'scope:platform',
                'scope:workspace',
                'scope:module',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:engine',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:events',
                'scope:engine',
              ],
            },
            {
              sourceTag: 'scope:integration',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:platform',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:database',
              onlyDependOnLibsWithTags: [
                'scope:contracts',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:design-system',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {},
  },
];

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
                'layer:core',
                'layer:domain',
                'layer:engines',
                'layer:ai',
                'layer:integration',
              ],
            },
            {
              sourceTag: 'scope:web',
              notDependOnLibsWithTags: ['layer:engines'],
            },
            {
              sourceTag: 'scope:marketing',
              onlyDependOnLibsWithTags: [],
            },
            {
              sourceTag: 'scope:api',
              notDependOnLibsWithTags: ['layer:engines'],
            },
            {
              sourceTag: 'scope:worker',
              onlyDependOnLibsWithTags: [
                'layer:core',
                'layer:domain',
                'layer:engines',
                'layer:ai',
                'layer:integration',
              ],
            },
            {
              sourceTag: 'layer:engines',
              onlyDependOnLibsWithTags: [
                'layer:core',
                'layer:domain',
                'layer:ai',
              ],
            },
            {
              sourceTag: 'layer:ai',
              onlyDependOnLibsWithTags: ['layer:core'],
            },
            {
              sourceTag: 'layer:core',
              onlyDependOnLibsWithTags: ['layer:core'],
            },
            {
              sourceTag: 'layer:domain',
              onlyDependOnLibsWithTags: ['layer:core', 'layer:domain'],
            },
            {
              sourceTag: 'layer:integration',
              onlyDependOnLibsWithTags: ['layer:core', 'layer:integration'],
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
  {
    files: ['**/*.css'],
    plugins: ['eslint-plugin-css'],
    rules: {
      'css/rule-name': 'error',
    },
  },
  {
    files: ['**/*.html'],
    plugins: ['eslint-plugin-html'],
    rules: {
      'html/report-bad-indentation': 'error',
    },
  },
];

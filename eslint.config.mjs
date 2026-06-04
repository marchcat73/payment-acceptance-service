const eslintConfig = [
  {
    ignores: [
      '**/node_modules/',
      '**/out/',
      '**/.next/',
      '**/dist/',
      '**/volumes/',
      '**/__tests__/',
      '**/__mocks__/',
    ],
  },
  {
    rules: {
      indent: 'off',
      // Disable prop-types as we use TypeScript for type checking
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-interface': [
        'error',
        {
          allowSingleExtends: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        2,
        {
          argsIgnorePattern: '^_',
        },
      ],
      'no-console': [
        2,
        {
          allow: ['warn', 'error', 'info'],
        },
      ],
    },
  },
];

export default eslintConfig;

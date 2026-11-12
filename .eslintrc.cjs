module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  env: { es2022: true },
  ignorePatterns: ['node_modules/', 'dist/'],
  overrides: [
    {
      files: ['frontend/src/**/*.{ts,tsx}'],
      env: { browser: true },
      plugins: ['react-hooks'],
      extends: ['plugin:react-hooks/recommended'],
    },
    {
      files: ['backend/**/*.ts', 'shared/**/*.ts'],
      env: { node: true },
    },
  ],
};

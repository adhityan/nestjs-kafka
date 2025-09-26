const globals = require('globals');
const eslintPlugin = require('@typescript-eslint/eslint-plugin');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const eslintPluginPrettier = require('eslint-plugin-prettier');
const parser = require('@typescript-eslint/parser');

module.exports = {
    ...prettierRecommended,
    languageOptions: {
        parser,
        parserOptions: {
            project: 'tsconfig.json',
            tsconfigRootDir: __dirname,
            sourceType: 'module',
        },
        globals: {
            ...globals.node,
            ...globals.jest,
        },
    },
    plugins: {
        '@typescript-eslint': eslintPlugin,
        prettier: eslintPluginPrettier,
    },
    ignores: ['.eslintrc.js'],
    rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
};

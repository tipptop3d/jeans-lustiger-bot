import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import eslint from '@eslint/js'

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.recommended,
	stylistic.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				parser: '@typescript-eslint/parser',
			},
		},
		rules: {
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/no-tabs': 'off',
			'@stylistic/quotes': ['error', 'single'],
			'@stylistic/semi': ['error', 'never'],
		},
	},
)

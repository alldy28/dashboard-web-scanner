// eslint.config.mjs
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename) // <-- Typo 'filename' diperbaiki

const compat = new FlatCompat({
  baseDirectory: __dirname
})

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    // Ini adalah blok 'ignores'.
    // Kita beritahu ESLint untuk mengabaikan file deklarasi DAN dirinya sendiri.
    ignores: [
      'declarations.d.ts',
      'eslint.config.mjs' // <-- TAMBAHKAN BARIS INI
    ]
  }
)

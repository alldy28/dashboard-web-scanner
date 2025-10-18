import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import tseslint from 'typescript-eslint'

// Setup path dan dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Setup compat layer untuk konfigurasi lama (seperti next/core-web-vitals)
const compat = new FlatCompat({
  baseDirectory: __dirname
})

// Bungkus seluruh konfigurasi dengan tseslint.config()
export default tseslint.config(
  // Konfigurasi Next.js Anda yang sudah ada
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // BLOK PENTING:
  // Ini adalah bagian yang hilang.
  // Ini memberi tahu ESLint untuk membaca tsconfig.json Anda,
  // yang akan membuatnya mengerti tipe kustom di declarations.d.ts
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
)

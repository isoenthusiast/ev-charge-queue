import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  fullyParallel: false,
  testIgnore: process.env.RESTART_CHECK ? [] : ['**/restart.spec.mjs'],
  use: { baseURL: 'http://localhost:3334', headless: true },
  reporter: 'list',
  timeout: 30000,
})

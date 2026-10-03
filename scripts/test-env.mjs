import { loadEnvFile } from 'node:process'
try {
  loadEnvFile('.env')
} catch (e) {
  if (e.code !== 'ENOENT') throw e
}
export function testEnv() {
  const raw = process.env.TEST_DATABASE_URL
  if (!raw)
    throw new Error('Set TEST_DATABASE_URL to a dedicated local *_test PostgreSQL database.')
  const url = new URL(raw)
  if (
    !['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname) ||
    !/^\/[a-z0-9_]+_test$/.test(url.pathname)
  )
    throw new Error(
      'Tests require a local database with a name ending _test. Remote databases are refused.'
    )
  if (process.env.DATABASE_URL && new URL(process.env.DATABASE_URL).pathname === url.pathname)
    throw new Error('Test and development database names must differ.')
  return {
    ...process.env,
    DATABASE_URL: raw,
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: '3334',
    APP_URL: 'http://localhost:3334',
    SESSION_DRIVER: 'database',
    DB_SSL: 'false',
    LOG_LEVEL: 'error',
  }
}

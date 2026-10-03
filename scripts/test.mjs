import { spawnSync, spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { testEnv } from './test-env.mjs'
const env = testEnv()
env.APP_KEY = randomBytes(32).toString('base64')
env.TEST_EMAIL = `test-${randomBytes(6).toString('hex')}@example.test`
env.TEST_OTHER_EMAIL = `other-${randomBytes(6).toString('hex')}@example.test`
env.TEST_PASSWORD = randomBytes(24).toString('base64url')
const run = (args, extra = {}) => {
  const r = spawnSync(process.execPath, args, { env: { ...env, ...extra }, stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`Command failed: ${args.join(' ')}`)
}
run(['build/ace.js', 'migration:run', '--force'])
run(['build/ace.js', 'user:create'], {
  BOOTSTRAP_EMAIL: env.TEST_EMAIL,
  BOOTSTRAP_PASSWORD: env.TEST_PASSWORD,
})
run(['build/ace.js', 'user:create'], {
  BOOTSTRAP_EMAIL: env.TEST_OTHER_EMAIL,
  BOOTSTRAP_PASSWORD: env.TEST_PASSWORD,
})
let server
async function stop() {
  if (!server || server.exitCode !== null) return
  const child = server
  const exited = new Promise((resolve) => child.once('exit', resolve))
  child.kill('SIGTERM')
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000)
  await exited
  clearTimeout(timer)
}
async function start() {
  server = spawn(process.execPath, ['build/bin/server.js'], {
    env: { ...env, NODE_ENV: 'production' },
    stdio: 'inherit',
  })
  for (let n = 0; n < 100; n++) {
    if (server.exitCode !== null) throw new Error('Server exited before readiness')
    try {
      if ((await fetch('http://localhost:3334/health/ready')).ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Server did not become ready')
}
try {
  await start()
  run(['node_modules/@playwright/test/cli.js', 'test'])
  await stop()
  await start()
  run(['node_modules/@playwright/test/cli.js', 'test', 'tests/e2e/restart.spec.mjs'], {
    RESTART_CHECK: '1',
  })
} finally {
  await stop()
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: env.DATABASE_URL })
  await client.connect()
  await client.query(
    'DELETE FROM sessions WHERE user_id IN (SELECT id::text FROM users WHERE email = ANY($1::text[]))',
    [[env.TEST_EMAIL, env.TEST_OTHER_EMAIL]]
  )
  await client.query(
    'DELETE FROM locations WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1::text[]))',
    [[env.TEST_EMAIL, env.TEST_OTHER_EMAIL]]
  )
  await client.query('DELETE FROM users WHERE email = ANY($1::text[])', [
    [env.TEST_EMAIL, env.TEST_OTHER_EMAIL],
  ])
  await client.end()
}

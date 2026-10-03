import { spawnSync } from 'node:child_process'
import { testEnv } from './test-env.mjs'
testEnv() // Refuse unsafe targets before doing work.
for (const command of ['typecheck', 'lint', 'build', 'test']) {
  const result = spawnSync('npm', ['run', command], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) process.exit(result.status || 1)
}
console.log(
  'PASS: typecheck, lint, build, PostgreSQL migrations, browser workflow and restart persistence.'
)

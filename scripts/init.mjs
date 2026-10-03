import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
const args = process.argv.slice(2)
const at = args.indexOf('--name')
const name = at < 0 ? 'my-app' : args[at + 1]
if (!name || !/^[a-z][a-z0-9-]{1,49}$/.test(name))
  throw new Error('Use --name with a lowercase slug, 2–50 characters.')
if (!existsSync('.env')) {
  writeFileSync(
    '.env',
    readFileSync('.env.example', 'utf8').replace(
      'APP_KEY=',
      `APP_KEY=${randomBytes(32).toString('base64')}`
    ),
    { mode: 0o600, flag: 'wx' }
  )
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
pkg.name = name
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
if (existsSync('package-lock.json')) {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
  lock.name = name
  if (lock.packages?.['']) lock.packages[''].name = name
  writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n')
}
console.log(
  `Initialized ${name}. Existing secrets preserved. Configure DATABASE_URL in .env before migrations.`
)

// Read-only deployed smoke check. Mutating browser suite is deliberately local-only.
const at = process.argv.indexOf('--base-url')
if (at < 0 || !process.argv[at + 1])
  throw new Error('Usage: npm run starter:smoke -- --base-url https://your-staging-host')
const base = new URL(process.argv[at + 1])
if (!['http:', 'https:'].includes(base.protocol)) throw new Error('HTTP(S) required')
for (const path of ['/health/live', '/health/ready', '/login']) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(10000) })
  if (response.status !== 200) throw new Error(`${path}: HTTP ${response.status}`)
  console.log(`PASS ${path}`)
}
const protectedPage = await fetch(new URL('/notes', base), {
  redirect: 'manual',
  signal: AbortSignal.timeout(10000),
})
if (protectedPage.status !== 302 || !protectedPage.headers.get('location')?.endsWith('/login'))
  throw new Error('Private route did not redirect to login')
console.log('PASS private route. Read-only smoke only; not authenticated deployment verification.')

import limiter from '@adonisjs/limiter/services/main'
import { createHash } from 'node:crypto'
// Bound per account across workers without storing emails in limiter keys.
export const loginThrottle = limiter.define('login', ({ request }) => {
  const identity = String(request.input('email', '')).trim().toLowerCase().slice(0, 254)
  return limiter
    .allowRequests(10)
    .every('1 minute')
    .usingKey(createHash('sha256').update(identity).digest('hex'))
})

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { loginThrottle } from '#start/limiter'
import db from '@adonisjs/lucid/services/db'
const SessionController = () => import('#controllers/session_controller')
const NotesController = () => import('#controllers/notes_controller')
router.get('/health/live', async () => ({ status: 'ok' }))
router.get('/health/ready', async ({ response }) => {
  try {
    await db.rawQuery('SELECT 1')
    return { status: 'ok' }
  } catch {
    return response.serviceUnavailable({ status: 'unavailable' })
  }
})
router.get('/', ({ response }) => response.redirect('/notes')).as('home')
router
  .group(() => {
    router.get('/login', [SessionController, 'create']).as('session.create')
    router.post('/login', [SessionController, 'store']).as('session.store').use(loginThrottle)
  })
  .use(middleware.guest())
router
  .group(() => {
    router.get('/notes', [NotesController, 'index']).as('dashboard')
    router.post('/notes', [NotesController, 'store'])
    router.post('/notes/:id/toggle', [NotesController, 'toggle'])
    router.post('/notes/:id/delete', [NotesController, 'destroy'])
    router.post('/logout', [SessionController, 'destroy']).as('session.destroy')
  })
  .use(middleware.auth())

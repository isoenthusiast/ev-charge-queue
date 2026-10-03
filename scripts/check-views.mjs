import { Edge } from 'edge.js'
import { cp, mkdir, writeFile } from 'node:fs/promises'
await mkdir('/tmp/ev-views', { recursive: true })
await cp('resources/views', '/tmp/ev-views', { recursive: true })
await writeFile('/tmp/ev-views/partials/head.edge', '<title>Charge Queue</title>')
const e = new Edge()
e.mount('/tmp/ev-views')
e.global('csrfField', () => '')
const common = { auth: { user: { email: 'demo@example.test' } }, flashMessages: { has: () => false, get: () => '' } }
for (const [v, d] of [['home', { locations: [], cars: [] }], ['location', { location: { id: 1, name: 'Cove EV', timezone: 'Asia/Kuala_Lumpur' }, member: { role: 'admin' }, chargers: [{id:1,name:'Bay 01',status:'available',connector:'Type 2',power_kw:7.4}], cars: [{id:1,plate:'EV123',label:'My EV'}], bookings: [], slots: [{iso:'2026-10-05T00:00:00Z',label:'08:00'}], members: [], reports: [], audit: [], day: '2026-10-04', today: '2026-10-04' }], ['error', { message: 'Test' }]]) {
  await e.render('pages/charging/' + v, { ...common, ...d })
  console.log('Rendered', v)
}

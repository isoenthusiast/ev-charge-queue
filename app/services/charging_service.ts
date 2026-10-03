import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
export class ChargingError extends Error {
  constructor(
    message: string,
    public status = 422
  ) {
    super(message)
  }
}
export const positiveId = (value: unknown) => {
  const n = Number(value)
  if (!Number.isSafeInteger(n) || n < 1) throw new ChargingError('Invalid identifier.')
  return n
}
export function text(value: unknown, min = 1, max = 100) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    throw new ChargingError(`Enter between ${min} and ${max} characters.`)
  return value.trim()
}
const fail = (message: string, status = 422): never => {
  throw new ChargingError(message, status)
}
const audit = (
  trx: TransactionClientContract,
  location: number,
  actor: number,
  action: string,
  detail: string
) => trx.table('charging_audit').insert({ location_id: location, actor_id: actor, action, detail })
export default class ChargingService {
  static async access(user: number, location: number, admin = false) {
    const row = await db
      .from('location_members')
      .where({ user_id: user, location_id: location })
      .first()
    if (!row || (admin && row.role !== 'admin'))
      fail('You do not have access to this location.', 403)
    return row
  }
  static async locationWrite<T>(
    user: number,
    location: number,
    admin: boolean,
    work: (trx: TransactionClientContract) => Promise<T>
  ): Promise<T> {
    return db.transaction(async (trx) => {
      await trx.from('locations').where('id', location).forUpdate().first()
      const member = await trx
        .from('location_members')
        .where({ user_id: user, location_id: location })
        .first()
      if (!member || (admin && member.role !== 'admin'))
        fail('You do not have permission for this action.', 403)
      return work(trx)
    })
  }
  static async createLocation(user: number, name: unknown) {
    return db.transaction(async (trx) => {
      const [row] = await trx
        .table('locations')
        .insert({ name: text(name, 2, 100), created_by: user })
        .returning('id')
      await trx
        .table('location_members')
        .insert({ location_id: row.id, user_id: user, role: 'admin' })
      return row.id as number
    })
  }
  static async car(user: number, plate: unknown, label: unknown) {
    const normalized = text(plate, 2, 20).toUpperCase().replace(/\s+/g, '')
    if (!/^[A-Z0-9-]+$/.test(normalized)) fail('Use letters, numbers or hyphens for the plate.')
    await db.table('cars').insert({ user_id: user, plate: normalized, label: text(label, 2, 60) })
  }
  static async member(user: number, location: number, email: unknown, role: unknown) {
    const e = text(email, 3, 254).toLowerCase()
    if (!['member', 'admin'].includes(String(role))) fail('Choose a valid role.')
    return this.locationWrite(user, location, true, async (trx) => {
      const target = await trx.from('users').whereRaw('lower(email) = ?', [e]).first()
      if (!target)
        fail('No account with that email. Ask the account administrator to create it first.')
      const old = await trx
        .from('location_members')
        .where({ location_id: location, user_id: target.id })
        .first()
      if (old?.role === 'admin' && role === 'member') {
        const admins = await trx
          .from('location_members')
          .where({ location_id: location, role: 'admin' })
        if (admins.length <= 1) fail('A location must retain at least one admin.')
      }
      await trx
        .table('location_members')
        .insert({ location_id: location, user_id: target.id, role })
        .onConflict(['location_id', 'user_id'])
        .merge(['role'])
      await audit(trx, location, user, 'membership', `User ${target.id}: ${role}`)
    })
  }
  static async addCharger(user: number, location: number, data: Record<string, unknown>) {
    const power = Number(data.power)
    if (!Number.isFinite(power) || power <= 0 || power > 1000)
      fail('Power must be between 0 and 1000 kW.')
    return this.locationWrite(user, location, true, async (trx) => {
      await trx.table('chargers').insert({
        location_id: location,
        name: text(data.name, 2, 80),
        connector: text(data.connector, 2, 40),
        power_kw: power,
      })
      await audit(trx, location, user, 'charger_created', text(data.name, 2, 80))
    })
  }
  static async chargerLocation(id: number) {
    const charger = await db.from('chargers').where('id', id).first()
    if (!charger) fail('Charger not found.', 404)
    return charger
  }
  static async book(user: number, chargerId: number, carId: number, start: unknown) {
    const charger = await this.chargerLocation(chargerId)
    const dt = DateTime.fromISO(text(start, 10, 40), { setZone: true })
    const ms = dt.toMillis()
    if (!dt.isValid || ms % 1800000 !== 0 || ms < Date.now() || ms > Date.now() + 14 * 86400000)
      fail('Choose a future half-hour slot within the next 14 days.')
    return this.locationWrite(user, charger.location_id, false, async (trx) => {
      const current = await trx.from('chargers').where('id', chargerId).first()
      if (current.status !== 'available')
        fail('This charger is unavailable until an admin marks it repaired.', 409)
      const car = await trx.from('cars').where('id', carId).first()
      const role = await trx
        .from('location_members')
        .where({ location_id: charger.location_id, user_id: user })
        .first()
      if (!car || (car.user_id !== user && role.role !== 'admin'))
        fail('You can only book a car you own.', 403)
      const owner = await trx
        .from('location_members')
        .where({ location_id: charger.location_id, user_id: car.user_id })
        .first()
      if (!owner) fail('The car owner must belong to this location.', 403)
      const [booking] = await trx
        .table('bookings')
        .insert({
          charger_id: chargerId,
          car_id: carId,
          user_id: car.user_id,
          slot_start: dt.toJSDate(),
        })
        .returning('id')
      await audit(
        trx,
        charger.location_id,
        user,
        'booked',
        `Booking ${booking.id}; charger ${chargerId}; car ${carId}; ${dt.toISO()}`
      )
      return booking.id
    })
  }
  static async bookingAction(user: number, id: number, action: string) {
    const b = await db
      .from('bookings')
      .join('chargers', 'chargers.id', 'bookings.charger_id')
      .where('bookings.id', id)
      .select('bookings.*', 'chargers.location_id')
      .first()
    if (!b) fail('Booking not found.', 404)
    return this.locationWrite(user, b.location_id, false, async (trx) => {
      const current = await trx.from('bookings').where('id', id).first()
      if (current.user_id !== user) fail('You can only change your own booking.', 403)
      const now = Date.now()
      const start = new Date(current.slot_start).getTime()
      const c = await trx.from('chargers').where('id', current.charger_id).first()
      let changes: Record<string, unknown>
      if (action === 'release' && current.state === 'booked' && now < start + 1800000)
        changes = { state: 'released' }
      else if (
        action === 'start' &&
        current.state === 'booked' &&
        c.status === 'available' &&
        now >= start &&
        now < start + 1800000
      )
        changes = { state: 'charging', started_at: new Date() }
      else if (action === 'finish' && current.state === 'charging')
        changes = { state: 'completed', ended_at: new Date() }
      else fail('This action is not available for the current booking or time.', 409)
      await trx.from('bookings').where('id', id).update(changes!)
      await audit(trx, b.location_id, user, action, `Booking ${id}`)
      return b.location_id
    })
  }
  private static async unavailable(trx: TransactionClientContract, chargerId: number) {
    await trx
      .from('bookings')
      .where('charger_id', chargerId)
      .where((q) =>
        q
          .where('state', 'charging')
          .orWhere((q2) =>
            q2.where('state', 'booked').where('slot_start', '>=', new Date(Date.now() - 1800000))
          )
      )
      .update({
        state: 'cancelled',
        ended_at: trx.raw('CASE WHEN started_at IS NOT NULL THEN now() ELSE NULL END'),
      })
  }
  static async status(user: number, id: number, status: unknown, reason: unknown) {
    if (!['available', 'maintenance', 'faulty'].includes(String(status)))
      fail('Choose a valid charger status.')
    const note = text(reason, 5, 1000)
    const c = await this.chargerLocation(id)
    return this.locationWrite(user, c.location_id, true, async (trx) => {
      await trx.from('chargers').where('id', id).update({ status })
      if (status !== 'available') await this.unavailable(trx, id)
      await audit(trx, c.location_id, user, 'charger_status', `Charger ${id} → ${status}. ${note}`)
      return c.location_id
    })
  }
  static async report(user: number, id: number, description: unknown) {
    const c = await this.chargerLocation(id)
    return this.locationWrite(user, c.location_id, false, async (trx) => {
      await trx
        .table('fault_reports')
        .insert({ charger_id: id, reporter_id: user, description: text(description, 5, 1000) })
      return c.location_id
    })
  }
  static async review(user: number, id: number, decision: unknown, reason: unknown) {
    if (!['verified', 'dismissed'].includes(String(decision))) fail('Choose verify or dismiss.')
    const note = text(reason, 5, 1000)
    const r = await db
      .from('fault_reports')
      .join('chargers', 'chargers.id', 'fault_reports.charger_id')
      .where('fault_reports.id', id)
      .select('fault_reports.*', 'chargers.location_id')
      .first()
    if (!r) fail('Report not found.', 404)
    return this.locationWrite(user, r.location_id, true, async (trx) => {
      const current = await trx.from('fault_reports').where('id', id).first()
      if (current.state !== 'pending') fail('This report was already reviewed.', 409)
      await trx
        .from('fault_reports')
        .where('id', id)
        .update({ state: decision, resolution: note, reviewed_by: user, reviewed_at: new Date() })
      if (decision === 'verified') {
        await trx.from('chargers').where('id', r.charger_id).update({ status: 'faulty' })
        await this.unavailable(trx, r.charger_id)
      }
      await audit(trx, r.location_id, user, 'fault_review', `Report ${id} → ${decision}. ${note}`)
      return r.location_id
    })
  }
  static async editSession(user: number, id: number, data: Record<string, unknown>) {
    const b = await db
      .from('bookings')
      .join('chargers', 'chargers.id', 'bookings.charger_id')
      .join('locations', 'locations.id', 'chargers.location_id')
      .where('bookings.id', id)
      .select('bookings.*', 'chargers.location_id', 'locations.timezone')
      .first()
    if (!b) fail('Session not found.', 404)
    const state = String(data.state)
    const reason = text(data.reason, 5, 1000)
    if (!['booked', 'charging', 'completed', 'cancelled'].includes(state))
      fail('Invalid session state.')
    const parse = (v: unknown) => (v ? DateTime.fromISO(String(v), { zone: b.timezone }) : null)
    const start = parse(data.started)
    const end = parse(data.ended)
    if (
      (start && (!start.isValid || start.toMillis() > Date.now() + 60000)) ||
      (end && (!end.isValid || end.toMillis() > Date.now() + 60000))
    )
      fail('Actual session times must be valid and cannot be in the future.')
    if (end && (!start || end < start)) fail('End time must follow start time.')
    if (state === 'charging' && (!start || end))
      fail('Charging needs a start time and no end time.')
    if (state === 'completed' && (!start || !end))
      fail('Completed sessions need both start and end times.')
    if (state === 'booked' && (start || end))
      fail('A booked session cannot have actual charging times.')
    return this.locationWrite(user, b.location_id, true, async (trx) => {
      const c = await trx.from('chargers').where('id', b.charger_id).first()
      if (['booked', 'charging'].includes(state) && c.status !== 'available')
        fail('Repair the charger before activating a booking.', 409)
      if (state === 'booked' && new Date(b.slot_start).getTime() + 1800000 < Date.now())
        fail('A past slot cannot be reopened.', 409)
      if (
        state === 'charging' &&
        (Date.now() < new Date(b.slot_start).getTime() ||
          Date.now() >= new Date(b.slot_start).getTime() + 1800000)
      )
        fail('Charging can only start during the reserved slot.', 409)
      await trx
        .from('bookings')
        .where('id', id)
        .update({ state, started_at: start?.toJSDate() ?? null, ended_at: end?.toJSDate() ?? null })
      await audit(
        trx,
        b.location_id,
        user,
        'session_corrected',
        `Booking ${id} → ${state}; start ${start?.toISO() ?? '-'}; end ${end?.toISO() ?? '-'}. ${reason}`
      )
      return b.location_id
    })
  }
}

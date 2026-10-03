import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import ChargingService, { ChargingError, positiveId } from '#services/charging_service'
export default class ChargingController {
  async index({ auth, view }: HttpContext) {
    const locations = await db
      .from('locations')
      .join('location_members', 'locations.id', 'location_members.location_id')
      .where('location_members.user_id', auth.user!.id)
      .select('locations.*', 'location_members.role')
    const cars = await db.from('cars').where('user_id', auth.user!.id)
    return view.render('pages/charging/home', { locations, cars })
  }
  async show(ctx: HttpContext) {
    try {
      const id = positiveId(ctx.params.id)
      const user = ctx.auth.user!.id
      const member = await ChargingService.access(user, id)
      const location = await db.from('locations').where('id', id).first()
      let day = DateTime.fromISO(
        String(ctx.request.input('day') || DateTime.now().setZone(location.timezone).toISODate()),
        { zone: location.timezone }
      ).startOf('day')
      if (!day.isValid || Math.abs(day.diffNow('days').days) > 15)
        day = DateTime.now().setZone(location.timezone).startOf('day')
      const chargers = await db.from('chargers').where('location_id', id).orderBy('name')
      const cars = await db
        .from('cars')
        .join('location_members', 'cars.user_id', 'location_members.user_id')
        .where('location_members.location_id', id)
        .if(member.role !== 'admin', (q) => q.where('cars.user_id', user))
        .select('cars.*')
      const bookings = await db
        .from('bookings')
        .join('chargers', 'chargers.id', 'bookings.charger_id')
        .join('cars', 'cars.id', 'bookings.car_id')
        .where('chargers.location_id', id)
        .where('slot_start', '>=', day.toJSDate())
        .where('slot_start', '<', day.plus({ days: 1 }).toJSDate())
        .select('bookings.*', 'cars.plate', 'cars.label', 'chargers.name as charger_name')
        .orderBy('slot_start')
      const format = (v: Date) => DateTime.fromJSDate(new Date(v)).setZone(location.timezone)
      const rows = bookings.map((b) => ({
        ...b,
        time: format(b.slot_start).toFormat('HH:mm'),
        end: format(b.slot_start).plus({ minutes: 30 }).toFormat('HH:mm'),
        own: b.user_id === user,
        started: b.started_at ? format(b.started_at).toFormat("yyyy-MM-dd'T'HH:mm") : '',
        ended: b.ended_at ? format(b.ended_at).toFormat("yyyy-MM-dd'T'HH:mm") : '',
        canStart:
          b.state === 'booked' &&
          Date.now() >= new Date(b.slot_start).getTime() &&
          Date.now() < new Date(b.slot_start).getTime() + 1800000,
        canRelease: b.state === 'booked' && Date.now() < new Date(b.slot_start).getTime() + 1800000,
      }))
      const slots = Array.from({ length: 48 }, (_, i) => {
        const t = day.plus({ minutes: i * 30 })
        return {
          iso: t.toUTC().toISO(),
          label: t.toFormat('HH:mm') + ' – ' + t.plus({ minutes: 30 }).toFormat('HH:mm'),
          future: t.toMillis() > Date.now() && t.toMillis() <= Date.now() + 14 * 86400000,
        }
      }).filter((s) => s.future)
      const members =
        member.role === 'admin'
          ? await db
              .from('location_members')
              .join('users', 'users.id', 'location_members.user_id')
              .where('location_id', id)
              .select('users.email', 'location_members.role')
          : []
      const reports = await db
        .from('fault_reports')
        .join('chargers', 'chargers.id', 'fault_reports.charger_id')
        .where('chargers.location_id', id)
        .if(member.role !== 'admin', (q) => q.where('reporter_id', user))
        .select('fault_reports.*', 'chargers.name as charger_name')
        .orderBy('fault_reports.id', 'desc')
        .limit(50)
      const audit =
        member.role === 'admin'
          ? await db.from('charging_audit').where('location_id', id).orderBy('id', 'desc').limit(30)
          : []
      return ctx.view.render('pages/charging/location', {
        location,
        member,
        chargers,
        cars,
        bookings: rows,
        slots,
        members,
        reports,
        audit,
        day: day.toISODate(),
        today: DateTime.now().setZone(location.timezone).toISODate(),
      })
    } catch (e) {
      return this.error(ctx, e)
    }
  }
  private async error(ctx: HttpContext, e: unknown) {
    let message = 'Unable to complete the request.'
    let status = 500
    if (e instanceof ChargingError) {
      message = e.message
      status = e.status
    } else if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
      message =
        'That slot, car, charger name or plate is already in use. Refresh and choose another.'
      status = 409
    } else throw e
    return ctx.response
      .status(status)
      .send(await ctx.view.render('pages/charging/error', { message }))
  }
  async action(ctx: HttpContext) {
    try {
      const u = ctx.auth.user!.id
      const d = ctx.request.body()
      const action = String(ctx.params.action)
      let location: number | undefined
      switch (action) {
        case 'location':
          location = await ChargingService.createLocation(u, d.name)
          break
        case 'car':
          await ChargingService.car(u, d.plate, d.label)
          break
        case 'member':
          location = positiveId(d.location)
          await ChargingService.member(u, location, d.email, d.role)
          break
        case 'charger':
          location = positiveId(d.location)
          await ChargingService.addCharger(u, location, d)
          break
        case 'book': {
          const charger = positiveId(d.charger)
          await ChargingService.book(u, charger, positiveId(d.car), d.start)
          const selectedCharger = await ChargingService.chargerLocation(charger)
          location = selectedCharger.location_id
          break
        }
        case 'release':
        case 'start':
        case 'finish':
          location = await ChargingService.bookingAction(u, positiveId(d.booking), action)
          break
        case 'status':
          location = await ChargingService.status(u, positiveId(d.charger), d.status, d.reason)
          break
        case 'report':
          location = await ChargingService.report(u, positiveId(d.charger), d.description)
          break
        case 'review':
          location = await ChargingService.review(u, positiveId(d.report), d.decision, d.reason)
          break
        case 'session':
          location = await ChargingService.editSession(u, positiveId(d.booking), d)
          break
        default:
          throw new ChargingError('Action not found.', 404)
      }
      ctx.session.flash('success', 'Saved successfully.')
      const day =
        typeof d.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.day) ? `?day=${d.day}` : ''
      return ctx.response.redirect(location ? `/locations/${location}${day}` : '/app')
    } catch (e) {
      return this.error(ctx, e)
    }
  }
}

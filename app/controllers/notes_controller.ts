import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import NotesService from '#services/notes_service'
const validator = vine.create({ title: vine.string().trim().minLength(1).maxLength(120) })
export default class NotesController {
  async index({ auth, view }: HttpContext) {
    return view.render('pages/notes', {
      notes: await NotesService.list(auth.user!.id),
      error: null,
    })
  }
  async store(ctx: HttpContext) {
    const [error, data] = await validator.tryValidate(ctx.request.only(['title']))
    if (error) {
      return ctx.response.status(422).send(
        await ctx.view.render('partials/notes_panel', {
          notes: await NotesService.list(ctx.auth.user!.id),
          error: 'Enter a title between 1 and 120 characters.',
        })
      )
    }
    await NotesService.create(ctx.auth.user!.id, data.title)
    return this.renderPanel(ctx)
  }
  async toggle(ctx: HttpContext) {
    const id = Number(ctx.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return ctx.response.notFound()
    const affected = await NotesService.toggle(ctx.auth.user!.id, id)
    if (!affected) return ctx.response.notFound()
    return this.renderPanel(ctx)
  }
  async destroy(ctx: HttpContext) {
    const id = Number(ctx.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return ctx.response.notFound()
    if (!(await NotesService.remove(ctx.auth.user!.id, id))) return ctx.response.notFound()
    return this.renderPanel(ctx)
  }
  private async renderPanel(ctx: HttpContext) {
    if (!ctx.request.header('HX-Request')) return ctx.response.redirect('/notes')
    return ctx.view.render('partials/notes_panel', {
      notes: await NotesService.list(ctx.auth.user!.id),
      error: null,
    })
  }
}

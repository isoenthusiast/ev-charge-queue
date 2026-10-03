import Note from '#models/note'
import db from '@adonisjs/lucid/services/db'
export default class NotesService {
  static list(userId: number) {
    return Note.query().where('userId', userId).orderBy('id', 'desc')
  }
  static create(userId: number, title: string) {
    return Note.create({ userId, title, done: false })
  }
  static async toggle(userId: number, id: number) {
    const rows = await db
      .from('notes')
      .where('user_id', userId)
      .where('id', id)
      .update({ done: db.raw('NOT done') })
      .returning('id')
    return rows.length > 0
  }
  static async remove(userId: number, id: number) {
    const rows = await db
      .from('notes')
      .where('user_id', userId)
      .where('id', id)
      .delete()
      .returning('id')
    return rows.length > 0
  }
}

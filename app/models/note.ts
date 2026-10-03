import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
export default class Note extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare userId: number
  @column() declare title: string
  @column() declare done: boolean
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
}

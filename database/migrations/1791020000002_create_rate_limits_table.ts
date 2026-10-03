import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('rate_limits', (table) => {
      table.string('key', 255).notNullable().primary()
      table.integer('points').notNullable().defaultTo(0)
      table.bigint('expire').unsigned()
    })
  }
  async down() {
    this.schema.dropTable('rate_limits')
  }
}

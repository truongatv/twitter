'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class HomesSchema extends Schema {
  up () {
    this.create('homes', (table) => {
      table.increments()
      table.string('name').notNullable()
      table.integer('admin_id').notNullable().unique()
      table.integer('living_cost_id').notNullable().unique()
      table.timestamps()
    })
  }

  down () {
    this.drop('homes')
  }
}

module.exports = HomesSchema

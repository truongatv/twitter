'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TweetSchema extends Schema {
  up () {
    this.create('tweets', (table) => {
      table.increments()
      table.integer('user_id').unsigned().notNullable()
      table.text('tweet').notNullable()
      table.timestamps()
    })
  }

  user () { 
    return this.belongsTo('App/Models/User')
  }

  replies() {
    return this.hasMany('App/Models/Reply')
  }

  favorites() {
    return this.hasMany('App/Models/Favorite')
  }

  down () {
    this.drop('tweets')
  }
}

module.exports = TweetSchema

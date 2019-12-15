'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up () {
    this.create('users', table => {
      table.increments()
      table.string('name').notNullable()
      table.string('username', 80).notNullable().unique()
      table.string('email', 254).notNullable().unique()
      table.string('password', 60).notNullable()
      table.string('location').nullable()
      table.string('website_url').nullable()
      table.text('bio').nullable()
      table.timestamps()
    })
  }

  tweets () {
    return this.hasMany('App/Models/Tweet')
  }
  
  //user_id is foreign key and follower_id as the foreign key for the related model.
  followers () { 
    return this.belongsToMany(
      'App/Models/User',
      'user_id',
      'follower_id'
    ).pivotTable('followers')
  }

  //follower_id is foreign key and user_id as the foreign key for the related model.
  following () {
    return this.belongsToMany(
        'App/Models/User',
        'follower_id',
        'user_id'
    ).pivotTable('followers')
  }

  replies () {
    return this.hasMany('App/Models/Reply')
  }

  favorites () {
    return this.hasMany('App/Models/Favorite')
  }

  down () {
    this.drop('users')
  }
}

module.exports = UserSchema

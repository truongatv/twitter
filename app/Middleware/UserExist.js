'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User = use('App/Models/User')
const Config = use('Config')

class UserExist {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response }, next) {
    // call next to advance the request
    const email = request.input('email')
    const user = await User.findBy('email', email)
    if(user) 
      await next()
    else {
      return response.status(400).json({
        message: Config.get('errors.message.userNotExist')
      })
    }
  }
}

module.exports = UserExist

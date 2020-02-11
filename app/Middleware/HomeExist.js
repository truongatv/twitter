'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User = use('App/Models/User')
const Config = use('Config')

class HomeExist {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ auth, response }, next) {
    const homeId = await User.find(auth.current.user.id)
    if(homeId.home_id) {
      await next()
    } else {
      return response.status(400).json({
        message: Config.get('errors.message.homeNotExist')
      })
    }
  }
}

module.exports = HomeExist

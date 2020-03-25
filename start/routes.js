'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.get('/', () => {
  return { greeting: 'Hello world in JSON' }
})

Route.post('/signup', 'UserController.signup')
Route.post('/login', 'UserController.login')
Route.get('/check_exist_email', 'UserController.checkExistEmail')
Route.put('/confirm_account', 'UserController.confirmAccount')
Route.put('/check_exist_token', 'UserController.CheckExistToken')
Route.put('/reset_password', 'UserController.resetPassword')
Route.put('/request_reset_password', 'UserController.requestResetPassword').middleware(['UserExist'])

Route.group(() => {
  Route.get('/profile', 'UserController.profile')
  Route.put('/update_profile', 'UserController.updateProfile')
  Route.put('/change_ava', 'UserController.changeAvatar')
  Route.put('/change_password', 'UserController.changePassword')
  Route.put('/update_home', 'UserController.updateHomeId')
  Route.get('/get_language', 'UserController.getLanguage')
  Route.put('/update_language', 'UserController.updateLanguage')
})
  .prefix('account')
  .middleware(['auth:jwt'])

Route.group(() => {
  Route.get('/home_info', 'HomeController.homeInfo').middleware(['HomeExist'])
  Route.get('home_member', 'HomeController.getHomeMember')
  Route.put('/update_home', 'HomeController.homeUpdate')
  Route.get('/list_user', 'HomeController.listUser')
  Route.post('/add_member', 'HomeController.addMember').middleware(['HomeExist'])
  Route.put('/remove_member', 'HomeController.removeMember')
})
  .prefix('home')
  .middleware(['auth:jwt'])

Route.group(() => {
  Route.post('/create_cost', 'CostController.createCost')
  Route.get('/get_user_cost', 'CostController.getUserCost')
  Route.get('/get_home_cost', 'CostController.getHomeCost')
  Route.put('/update_cost', 'CostController.updateCost').middleware(['CostCreator'])
  Route.delete('/remove_cost/:id', 'CostController.removeCost').middleware(['CostCreator'])
})
  .prefix('cost')
  .middleware(['auth:jwt'])
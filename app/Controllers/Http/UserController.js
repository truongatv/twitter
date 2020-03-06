'use strict'
// add to the top of the file
const User = use('App/Models/User')
const UserToken = use('App/Models/UserToken')
const Hash = use('Hash')
const Database = use('Database')
const Config = use('Config')
const Mail = use('Mail')
const Env = use('Env')
const crypto = require('crypto')
class UserController {
    async signup({ request, auth, response }) {
        // get user data from signup form
        const user_data = request.only(['name', 'email', 'password'])

        try {
            // hash confirm account 
            const confirm_token = await crypto.randomBytes(10).toString('hex')
            let user_token = {
                email: user_data.email,
                token: confirm_token
            }
            // save user to database
            const user = await User.create(user_data)
            //save user token confirm to db
            await UserToken.create(user_token)
            // generate JWT token for user
            const token = await auth.generate(user)
            const sendmail_result = await Mail.send('emails.confirm', {
                data: user_data,
                url: Env.get('APP_FRONT_URL'),
                token: confirm_token
            }, (message) => {
                message
                    .to(user_data.email)
                    .from('truongatv2211@gmail.com')
                    .subject('Xác nhận đăng ký !')
            })
            console.log(sendmail_result)
            return response.json({
                status: 'success',
                data: token
            })
        } catch (error) {
            return response.status(400).json({
                status: 'error',
                message: error.sqlMessage,
                type: 'warning'
            })
        }
    }

    async login({ request, auth, response }) {
        try {
            // validate the user credentials and generate a JWT token
            const token = await auth.attempt(
                request.input('email'),
                request.input('password')
            )
            //check account status
            const status = await User.findBy('email', request.input('email'))
            if(status.status == 1) {
                return response.json({
                    status: 'success',
                    data: token
                })
            } else {
                throw Config.get('errors.message.needConfirmAccount')
            }
        } catch (error) {
            if (error == Config.get('errors.message.needConfirmAccount')) {
                return response.status(400).json({
                    status: Config.get('errors.message.needConfirmAccount')
                })
            } else {
                response.status(400).json({
                    status: Config.get('errors.message.userNotExist'),
                    message: 'Invalid email/password'
                })
            }
        }
    }

    /**
     * confirm account 
     */
    async confirmAccount({ request, response }) {
        try {
            const token = request.input('token')
            const email = request.input('email')
            const user_token = await UserToken.findBy('email', email)
            if (user_token && user_token.token == token) {
                try {
                    await UserToken.query().where('email', email).delete()
                } catch (error) {
                    throw (error)
                }
                //set status of user to active
                const user = await User.findBy('email', email)
                user.status = 1
                user.save()
                return response.json({
                    status: 200
                })
            } else {
                throw Config.get('errors.message.tokenNotExist')
            }
        } catch (error) {
            return response.json({
                status: 400
            })
        }

    }

    async profile({ auth, response }) {
        const user = await User.query()
            .where('id', auth.current.user.id)
            .with('home', builder => {
                builder.select('id', 'name')
            })
            .fetch()
        
        return response.json({
            status: 'success',
            data: user
        })
    }

    async updateProfile({ request, auth, response }) {
        try {
            // get currently authenticated user
            const user = auth.current.user

            // update with new data entered
            user.name = request.input('name')
            user.email = request.input('email')

            await user.save()

            return response.json({
                status: 'success',
                message: 'Cập nhật thành công',
                data: user
            })
        } catch (error) {
            return response.status(400).json({
                status: 'error',
                message: 'There was a problem updating profile, please try again later.'
            })
        }
    }

    // insert user to home
    async updateHomeId({ request, auth, response }) {
        try {
            //get current home id from admin
            const homeId = await Database
                .select('home_id')
                .from('users')
                .where('id', auth.current.user.id)
            //insert user to home 
            const userId = await Database
                .table('users')
                .where('email', request.input('email'))
                .update('home_id', homeId[0].home_id)

            return response.status(200).json({
                message: 'success',
                data: userId
            })
        } catch (error) {
            response.status(400).json({
                status: 'error',
                message: Config.get('errors.message.contInsertUserToHome')
            })
        }

    }

    async changePassword({ request, auth, response }) {
        // get currently authenticated user
        const user = auth.current.user

        // verify if current password matches
        const verifyPassword = await Hash.verify(
            request.input('password'),
            user.password
        )

        // display appropriate message
        // if (!verifyPassword) {
        //     return response.status(400).json({
        //         status: 'error',
        //         message: 'Current password could not be verified! Please try again.'
        //     })
        // }

        // hash and save new password
        user.password = await Hash.make(request.input('newPassword'))
        await user.save()

        return response.json({
            status: 'success',
            message: 'Password updated!'
        })
    }

    async checkExistEmail({ request, auth, response }) {
        const email = await User.findBy('email', request.input('email'))
        if (email) {
            return response.json({
                data: true
            })
        } else {
            return response.json({
                data: false
            })
        }
    }

    /**
     * get current language
     * @return {json} language  
     */
    async getLanguage({ auth, response }) {
        const user_id = auth.current.user.id
        const account = await User.find(user_id)
        return response.status(200).json({
            data: account.language
        })
    }

    /**
     * update language
     */
    async updateLanguage({ request, auth, response }) {
        try {
            const user = auth.current.user
            user.language = request.input('language')
            await user.save()
            return response.status(200).json({
                status: 'success'
            })
        } catch (error) {
            return response.status(400).json({
                status: 'error'
            })
        }
        

    }
}

module.exports = UserController

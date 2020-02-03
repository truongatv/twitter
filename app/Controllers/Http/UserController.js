'use strict'
// add to the top of the file
const User = use('App/Models/User')
const Hash = use('Hash')
const Database = use('Database')
const Config = use('Config')
class UserController {
    async signup({ request, auth, response }) {
        // get user data from signup form
        const userData = request.only(['name', 'username', 'email', 'password'])

        try {
            // save user to database
            // console.log(userData)
            const user = await User.create(userData)
            // generate JWT token for user
            const token = await auth.generate(user)

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

            return response.json({
                status: 'success',
                data: token
            })
        } catch (error) {
            response.status(400).json({
                status: 'error',
                message: 'Invalid email/password'
            })
        }
    }

    async profile ({ auth, response }) {
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
    async updateHomeId({request, auth, response}) {
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
        } catch(error) {
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
    
}

module.exports = UserController

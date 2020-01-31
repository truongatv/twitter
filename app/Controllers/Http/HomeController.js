'use strict'
const User = use('App/Models/User')
const Home = use('App/Models/Home')
const Database = use('Database')

class HomeController {
    async homeInfo({auth, response}) {
        //setup column need get
        const column = {
            home_name: 'homes.name', 
            address: 'homes.address', 
            admin_id: 'homes.admin_id', 
            full_name: 'users.name', 
            username: 'users.username', 
            user_id: 'users.id'
        }
        const homeInfo = await this.getHomeInfo(auth.current.user.id, column)
        if(homeInfo.length > 0) {
            return response.status(200).json({
                status: 'success',
                data: homeInfo
            })
        } else {
            return response.status(400).json({
                status: 'error'
            })
        }
    }

    async homeUpdate({request, auth, response}) {
        const homeId = await Database
            .select('home_id')
            .table('users')
            .innerJoin('homes', 'users.home_id', 'homes.id')
            .where('users.id', auth.current.user.id)
            .limit(1)
        if(homeId.length == 0) {
            const id = await Database
                .table('homes')
                .insert({
                    'name': request.input('name'),
                    'address': request.input('address'),
                    'admin_id': auth.current.user.id
                })
        } else {
            const id = await Database
                .table('homes')
                .where('id', homeId[0].home_id)
                .update({
                    'name': request.input('name'),
                    'address': request.input('address')
                })
        }

        return response.status(200).json({
            status: 'success'
        })
    }

    async listUser({auth, response}) {
        const column = {
            admin_id: 'homes.admin_id', 
            full_name: 'users.name', 
            username: 'users.username', 
            user_id: 'users.id'
        }
        const homeInfo = await this.getHomeInfo(auth.current.user.id, column)

        return response.status(200).json({
            status: 'message',
            data: homeInfo
        })
        
    }

    //get home info and list user
    async getHomeInfo(userId, column) {
        const home_id = await Database
            .select('homes.id')
            .table('users')
            .innerJoin('homes', 'users.home_id', 'homes.id')
            .where('users.id', userId)
            .limit(1)
        const homeInfo = await Database
            .select(column)
            .table('users')
            .innerJoin('homes', 'users.home_id', 'homes.id')
            .where('users.home_id', home_id[0].id)

        return homeInfo
    }
}

module.exports = HomeController

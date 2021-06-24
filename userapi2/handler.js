"use strict"

// import { Types } from 'mongoose'
// import { UserModel, SessionModel } from "./models"
//import config from "./config"
const config = require('./config')


module.exports = async (config) => {
    const routing = new Routing(config.app);
    routing.configure();
    routing.bind(routing.handle);
}

class Routing {
    constructor(app) {
        this.app = app;
        //config.connection()
    }

    configure() {
        const bodyParser = require('body-parser')
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.raw());
        this.app.use(bodyParser.text({ type: "text/*" }));
        this.app.disable('x-powered-by');
    }

    bind(route) {
        this.app.post('/*', route);
        this.app.get('/*', route);
        this.app.patch('/*', route);
        this.app.put('/*', route);
        this.app.delete('/*', route);
    }

    async create(data, model) {
        const savehandle = new model(data)
        return await savehandle.save().then(result => {
            if (!result) {
                return false
            } else {
                return result
            }
        })
    }

    async signAccessToken(req, users_id) {
        const expiredtime = getExpiredtime()
        const token = md5(users_id + expiredtime)
        const ip = getIPAddress(req)
        const row = {
            ip, token, expiredtime, userid: Types.ObjectId(users_id)
        }
        await Create(row, Models.Sessions)
        return token
    }

    async sessionUpdate(token) {
        const expiredtime = getExpiredtime()
        const ses = await Models.Sessions.findOneAndUpdate({ token }, { expiredtime }).populate("userid")
        console.log("updatesession")
        if (ses) {
            return ses.userid
        } else {
            return false
        }
    }

    getExpiredtime() {
        const expiredtime = new Date(new Date().valueOf() + parseInt(config.USER_SESSION_TIME))
        return expiredtime
    }

    getIPAddress(req) {
        const forwarded = req.headers['x-forwarded-for']
        const ips = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress
        return ips && ips.length > 0 && ips.indexOf(",") ? ips.split(",")[0] : null
    }

    handle(req, res, next) {
        res.send(req.path);
        // if (req.path == '/signin') {
        //     res.send(req.path);

        //     // const user = req.body
        //     // if (!user.password || (!user.email)) {
        //     //     return res.json({ status: false, data: "Please enter username and password" })
        //     // }
        //     // const userInfo = await Models.Users.findOne({ $or: [{ username: user.email }, { email: user.email }] })
        //     // if (!userInfo) {
        //     //     return res.json({ status: false, data: "Sorry, we can't find this email or username." })
        //     // }
        //     // if (!userInfo.validPassword(user.password, userInfo.password)) {
        //     //     return res.json({ status: false, data: 'You entered wrong password.' })
        //     // }
        //     // const session = await signAccessToken(req, userInfo._id)
        //     // const row = {
        //     //     email: userInfo.email,
        //     //     username: userInfo.username,
        //     //     firstname: userInfo.firstname,
        //     //     lastname: userInfo.lastname,
        //     //     role: BaseCon.getRole(userInfo.roleid),
        //     // }
        //     // return res.json({ status: true, user: row, accessToken: session })
        // }
        // else if (req.path == '/signup') {
        //     // const user = req.body

        //     // if (!user.username || !user.email || !user.password) {
        //     //     return res.json({ status: false, data: 'Please enter username and password' })
        //     // }
        //     // const emailExit = await Models.Users.findOne({ email: user.email })
        //     // if (emailExit) {
        //     //     return res.json({ status: false, data: 'It have already created' })
        //     // }
        //     // const usernameExit = await Models.Users.findOne({ username: user.username })
        //     // if (usernameExit) {
        //     //     return res.json({ status: false, data: 'It have already created' })
        //     // }
        //     // const result = await Create(user, Models.Users)
        //     // if (!result) {
        //     //     return res.json({ status: false, data: 'Internal server error' })
        //     // } else {
        //     //     const session = await signAccessToken(req, result._id)
        //     //     const row = {
        //     //         email: result.email,
        //     //         username: result.username,
        //     //         firstname: result.firstname,
        //     //         lastname: result.lastname,
        //     //         role: BaseCon.getRole(result.roleid),
        //     //     }
        //     //     return res.json({ status: true, user: row, accessToken: session })
        //     // }
        // }
        // else if (req.path == 'signout') {
        //     // const accessToken = req.headers.authorization
        //     // await Models.Sessions.findOneAndDelete({ token: accessToken })
        //     // return res.json({ status: false, session: true })
        // }
        // else if (req.path == 'changePassword') {
        //     // const { users_id, newPassword, currentPassword } = req.body
        //     // const user = await Models.Users.findById(users_id)
        //     // if (!user.validPassword(currentPassword, user.password)) {
        //     //     return res.json({ status: false, message: 'passwords do not match' })
        //     // }
        //     // const password = user.generateHash(newPassword)
        //     // const result = await Models.Users.findByIdAndUpdate(users_id, { password })
        //     // if (result) {
        //     //     return res.json({ status: true })
        //     // } else {
        //     //     return res.json({ status: false, error: "server error" })
        //     // }
        // }
    }
}

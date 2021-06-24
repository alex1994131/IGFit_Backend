"use strict"

const config = require('./config');
const cors = require('cors');
const bodyParser = require('body-parser')
const md5 = require('md5')

// import md5 from 'md5'
// import { Types } from 'mongoose'
// import { UserModel, SessionModel } from "./models"

const { Types } = require('mongoose');
const { UserModel, SessionModel } = require('./model')

module.exports = async (config) => {
    const routing = new Routing(config.app);
    routing.configure();
    routing.bind(routing.handle);
}

let self = null;
class Routing {
    constructor(app) {
        this.app = app;
        const connection = config.connection;
        self = this;
    }

    configure() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.raw());
        this.app.use(bodyParser.text({ type: "text/*" }));
        this.app.disable('x-powered-by');
        this.app.use(cors());
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

    async signAccessToken(req, user_id) {
        const expiredtime = self.getExpiredtime()
        const token = md5(user_id + expiredtime)
        const ip = self.getIPAddress(req)
        const row = {
            ip, token, expiredtime, user_id: Types.ObjectId(user_id)
        }
        await self.create(row, SessionModel)
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

    async handle(req, res, next) {
        if (req.path == '/signin') {
            const user = req.body;

            console.log(user);

            const userInfo = await UserModel.findOne({ email: user.email })
            if (!userInfo) {
                return res.json({ status: false, message: "Sorry, we can't find this email or username." })
            }
            if (!userInfo.validPassword(user.password, userInfo.password)) {
                return res.json({ status: false, message: 'You entered wrong password.' })
            }
            const session = await self.signAccessToken(req, userInfo._id)
            const row = {
                email: userInfo.email,
                username: userInfo.username,
                portofolio: userInfo.portofolio
            }
            return res.json({ status: true, user: row, accessToken: session })
        }
        else if (req.path == '/signup') {
            const user = req.body

            const emailExit = await UserModel.findOne({ email: user.email })
            if (emailExit) {
                return res.json({ status: false, message: 'It have already created' })
            }

            const result = await self.create(user, UserModel)
            if (!result) {
                return res.json({ status: false, message: 'Internal server error' })
            } else {
                return res.json({ status: true, message: 'Sign up success' })
            }
        }
        if (req.path == '/get_user') {
            const token = req.body;
            const accessToken = token.token

            const session_record = await SessionModel.findOne({ token: accessToken })
            const user_id = session_record.user_id
            if (!user_id) {
                return res.json({ status: false, data: "Sorry, we can't find Session record." })
            }

            const userInfo = await UserModel.findById(user_id)
            if (!userInfo) {
                return res.json({ status: false, data: "Sorry, we can't find user record." })
            }

            const row = {
                email: userInfo.email,
                username: userInfo.username,
                portofolio: userInfo.portofolio
            }

            return res.json({ status: true, user: row })
        }
        else if (req.path == '/signout') {
            const token = req.body;
            const accessToken = token.token

            await SessionModel.findOneAndDelete({ token: accessToken })
            return res.json({ status: true })
        }
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

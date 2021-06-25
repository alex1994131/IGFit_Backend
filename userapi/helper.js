
const config = require('./config');
const { Types } = require('mongoose');
const md5 = require('md5')
const moment = require('moment-timezone')

const create = async (data, model) => {
    const savehandle = new model(data)
    return await savehandle.save().then(result => {
        if (!result) {
            return false
        } else {
            return result
        }
    })
}

const signAccessToken = async (req, user_id, model) => {
    const expiredtime = getExpiredtime()
    const token = md5(user_id + expiredtime)
    const ip = getIPAddress(req)
    const row = {
        ip, token, expiredtime, user_id: Types.ObjectId(user_id)
    }
    await create(row, model)
    return token
}

const sessionUpdate = async (req, model) => {
    const accessToken = req.headers.authorization
    const token = accessToken.split(' ')[1]
    if (token && token.length) {
        const expiredtime = getExpiredtime()
        const ses = await model.findOneAndUpdate({ token }, { expiredtime }).populate("user_id")
        if (ses) {
            return ses.user_id
        } else {
            return false
        }
    } else {
        return false
    }
}

const getExpiredtime = () => {
    const expiredtime = new Date(new Date().valueOf() + parseInt(config.USER_SESSION_TIME))
    return expiredtime
}

const getIPAddress = (req) => {
    const forwarded = req.headers['x-forwarded-for']
    const ips = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress
    return ips && ips.length > 0 && ips.indexOf(",") ? ips.split(",")[0] : null
}

const getTimeZone = () => {
    let time = moment.tz(new Date(), "Europe/London")
    time.utc("+530").format()
    return time
}

const getPortfolio = async (user_id, model) => {
    let result = await model.find({ user_id: user_id })
    return result
}

module.exports = { create, signAccessToken, sessionUpdate, getExpiredtime, getIPAddress, getTimeZone, getPortfolio };
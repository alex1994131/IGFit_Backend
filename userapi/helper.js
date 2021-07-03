
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

// const create = async (data, model) => {
//     const savehandle = new model(data)
//     // console.log(savehandle)
//     const result = await savehandle.save()
//     // console.log(result);
//     if (!result) {
//         return false
//     } else {
//         return result
//     }
// }

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

const updateUserByPortfolio = async (user_id, update_data, model) => {
    let user_data = await model.find({ _id: user_id })
    let portfolio_data = user_data[0].portfolio;
    portfolio_data.push(update_data)
    let result = await model.updateOne({ _id: user_id }, { $set: { portfolio: portfolio_data } });
    return result
}

const getTransaction = async (portfolio, model) => {
    let result = await model.find({ _id: portfolio })
    if (result && result.length > 0) {
        return result[0].transaction
    }
    else {
        return []
    }
}

const updatePortfolioByTransaction = async (portfolio_id, update_data, model) => {
    let portfolio_data = await model.findOne({ _id: portfolio_id })
    let transaction_data = portfolio_data.transaction;
    transaction_data.push(update_data)
    let result = await model.updateOne({ _id: portfolio_id }, { $set: { transaction: transaction_data } });
    return result
}

const updatePrice = async (data, model) => {
    if (data.volume == 0) {
        if (await model.exists({ date: data.date })) return true;
    }

    let query = { date: data.date },
        options = { upsert: true, new: true, setDefaultsOnInsert: true };

    // Find the document
    const result = await model.findOneAndUpdate(query, data, options);

    if (!result) {
        return false
    } else {
        return result
    }
}

module.exports = {
    create,
    signAccessToken,
    sessionUpdate,
    getExpiredtime,
    getIPAddress,
    getTimeZone,
    getPortfolio,
    updateUserByPortfolio,
    getTransaction,
    updatePortfolioByTransaction,
    updatePrice
};
const { Types } = require('mongoose');

const create = async (data, model) => {
    const savehandle = new model(data)
    console.log(savehandle)
    const result = await savehandle.save()
    console.log(result);
    if (!result) {
        return false
    } else {
        return result
    }
}

const sessionUpdate = async (req) => {
    // const accessToken = req.headers.authorization
    // const token = accessToken.split(' ')[1]
    // if (token && token.length) {
    //     const expiredtime = getExpiredtime()
    //     const ses = await model.findOneAndUpdate({ token }, { expiredtime }).populate("user_id")
    //     if (ses) {
    //         return ses.user_id
    //     } else {
    //         return false
    //     }
    // } else {
    //     return false
    // }
}

const prepareDB = async (dbname) => {
    const url = `mongodb://localhost:3333/${dbname}`

    return new Promise((resolve, reject) => {
        MongoClient.connect(url, {}, (err, database) => {
            if (err) {
                console.log('error')
                return reject(err)
            }

            clientsDB = database.db(dbname);
            console.log('ok')
            return resolve(clientsDB)
        });
    });
}

const getExpiredtime = () => {
    const expiredtime = new Date(new Date().valueOf() + parseInt(config.USER_SESSION_TIME))
    return expiredtime
}

module.exports = { create, sessionUpdate, prepareDB, getExpiredtime };
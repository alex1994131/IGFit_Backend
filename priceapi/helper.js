const create = async (data, model) => {
    const savehandle = new model(data)
    // console.log(savehandle)
    const result = await savehandle.save()
    // console.log(result);
    if (!result) {
        return false
    } else {
        return result
    }
}

const update = async (data, model) => {
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

const getExpiredtime = () => {
    const expiredtime = new Date(new Date().valueOf() + parseInt(config.USER_SESSION_TIME))
    return expiredtime
}

module.exports = { create, update, sessionUpdate, getExpiredtime };
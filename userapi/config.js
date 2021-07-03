// import mongoose from 'mongoose'
const mongoose = require('mongoose')

// const dbconf = "mongodb://webpush_admin:Kiranku123%24@51.79.157.193:27731/webpush?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&authSource=webpush&authMechanism=SCRAM-SHA-256";
const dbconf = "mongodb://root:example_db_mongo@tim.immo:3333/igfit?authSource=admin&readPreference=primary&appname=MongoDB%20Compass"
module.exports = {
    USER_SESSION_TIME: 900,
    eodhistorical_api: 'https://eodhistoricaldata.com/api/search/',
    eodhistorical_token: '60db83f2b0ab55.00463877',
    connection: mongoose.connect(dbconf, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true, useCreateIndex: true }).then(() => {
        console.log('Database are connected');
    })
}
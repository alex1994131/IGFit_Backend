//import mongoose from 'mongoose'
const mongoose = require('mongoose')

// const dbconf = "mongodb://webpush_admin:Kiranku123%24@51.79.157.193:27731/webpush?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&authSource=webpush&authMechanism=SCRAM-SHA-256";
const dbconf = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false"
module.exports = {
    USER_SESSION_TIME: 900,
    connection: mongoose.connect(dbconf, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true, useCreateIndex: true }).then(() => {
        console.log('Database is connected');
    })
}


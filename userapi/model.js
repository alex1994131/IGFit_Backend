const { Schema, model } = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const { getTimeZone } = require('./helper')
const moment = require('moment-timezone')

const usersSchema = new Schema({
	username: {
		type: String,
		require: true
	},
	email: {
		type: String,
		require: true
	},
	password: {
		type: String,
		require: true
	},
	portfolio: {
		type: Array,
		default: []
	},
	currency: {
		type: String,
		default: 'USD'
	},
	createdAt: {
		type: Date
	},
	updatedAt: {
		type: Date
	}
})

usersSchema.pre('save', function (next) {
	const user = this
	bcrypt.genSalt(10, (err, salt) => {
		if (err) { return next(err) }
		bcrypt.hash(user.password, salt, null, (err, hash) => {
			if (err) { return next(err) }
			user.password = hash
			user.createdAt = getTimeZone()
			user.updatedAt = getTimeZone()
			next()
		})
	})
})

usersSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(10))
}

usersSchema.methods.comparePassword = function (candidatePassword, callback) {
	bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
		if (err) { return callback(err) }
		callback(null, isMatch)
	})
}

usersSchema.methods.validPassword = function (password, encrypted) {
	return bcrypt.compareSync(password, encrypted)
}

const UserModel = model('users', usersSchema)

const SessionSchema = new Schema({
	user_id: {
		type: Schema.Types.ObjectId, ref: 'users',
		require: true
	},
	token: {
		type: String,
		require: true
	},
	ip: {
		type: String,
		require: true
	},
	expiredtime: {
		type: Date,
		require: true
	},
})

const SessionModel = model('sessions', SessionSchema)

const PortfolioSchema = new Schema({
	user_id: {
		type: Schema.Types.ObjectId, ref: 'users',
		require: true
	},
	name: {
		type: String,
		require: true
	},
	value: {
		type: String,
		require: true
	},
	profit: {
		type: String,
		require: true
	},
	transaction: {
		type: Array,
		default: []
	},
	created_at: {
		type: Date,
		require: true
	},
	updated_at: {
		type: Date,
		require: true
	}
})

PortfolioSchema.pre('save', function (next) {
	const portfolio = this
	portfolio.value = 0
	portfolio.profit = 0
	portfolio.created_at = getTimeZone()
	portfolio.updated_at = getTimeZone()
	next()
})

const PortfolioModel = model('portfolios', PortfolioSchema)

// const TransactionSchema = new Schema({
// 	name: {
// 		type: String,
// 		require: true
// 	},
// 	ticker: {
// 		type: String,
// 		require: true
// 	},
// 	date: {
// 		type: Date,
// 		require: true
// 	},
// 	direction: {
// 		type: String,
// 		require: true
// 	},
// 	price: {
// 		type: String,
// 		require: true
// 	},
// 	quantity: {
// 		type: String,
// 		require: true
// 	},
// 	commission: {
// 		type: String,
// 		require: true
// 	},
// 	currency: {
// 		type: String,
// 		require: true
// 	}
// })

// const TransactionModel = model('transactions', TransactionSchema)

const priceSchema = new Schema({
	date: {
		type: Date,
		require: true
	},
	open: {
		type: Number,
		require: true
	},
	high: {
		type: Number,
		require: true
	},
	low: {
		type: Number,
		require: true
	},
	close: {
		type: Number,
		require: true
	},
	adjusted_close: {
		type: Number,
		require: true
	},
	volume: {
		type: Number,
		require: true
	}
})

priceSchema.pre('save', function (next) {
	const price = this
	let time = moment.tz(price.date, "Etc/UTC").add('5', 'hours');
	time = time.format()
	price.date = time
	next();
})

module.exports = { UserModel, SessionModel, PortfolioModel, priceSchema /*, TransactionModel */ };
const { Schema, model } = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const { getTimeZone } = require('./helper')

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
		type: Object,
		require: true
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
	expiredtime: {
		type: Date,
		require: true
	}
})

const PortfolioModel = model('portfolios', PortfolioSchema)

module.exports = { UserModel, SessionModel, PortfolioModel };
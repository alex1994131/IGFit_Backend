import { Schema, model } from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import { getTimeZone } from '../controllers/baseController'

const usersSchema = new Schema({
	email: {
		type: String,
		require: true
	},
	password: {
		type: String
	},
	username: {
		type: String,
		require: true
	},
	firstname: {
		type: String,
		default: ''
	},
	lastname: {
		type: String,
		default: ''
	},
	status: {
		type: String,
		default: 'active'
	},
	createdAt: {
		type: Date
	},
	updatedAt: {
		type: Date
	},
	roleid: {
		type: Schema.Types.ObjectId, ref: 'role',
		require: true
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

export const Users = model('users', usersSchema)

const SessionSchema = new Schema({
	userid: {
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

export const Sessions = model('sessions', SessionSchema)
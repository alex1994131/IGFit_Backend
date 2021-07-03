
const { Schema } = require('mongoose')

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
	volumn: {
		type: Number,
		require: true
	}
})

priceSchema.pre('save', function (next) {
	const price = this
	next();
})

module.exports = { priceSchema };
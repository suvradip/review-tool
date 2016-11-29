var db,
	review;

db = require('../dbconnection');

review = db.model('reviews', {
	username: {type: String, require: true, trim: true},
	avatar: {type: String, trim:true},
	review: {type: String, trim: true},
	name: {type: String, trim: true},
	time: {type: Date, default:new Date()}
});

module.exports = review;
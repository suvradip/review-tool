var db,
	review;

db = require('../dbconnection');

review = db.model('reviews', {
	username: {type: String, require: true, trim: true},
	avatar: {type: String, trim:true},
	review: {type: String, trim: true},
	name: {type: String, trim: true},
	screenshots: {type: String, trim: true},
	chartjson: {type: JSON},
	time: {type: Date, require: true,default: new Date().toGMTString()}
});

module.exports = review;
var db,
	user;

db = require('../dbconnection');

user = db.model('users', {
	userid: {type: String, require: true, trim: true, unique: true},
	username: {type: String, require: true, trim: true, unique: true},
	password: {type: String, require: true, trim: true},
	name: {type: String, trim: true},
	avatar: {type: String, trim:true},
	time: {type: Date, require: true, default: new Date().toGMTString()}
});

module.exports = user;
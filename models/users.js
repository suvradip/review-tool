var db,
	user;

db = require('../dbconnection');

review = db.model('setcharts', {
	userid: {type: String, require: true, trim: true},
	username: {type: String, require: true, trim: true},
	name: {type: String, trim: true},
	avatar: {type: String, trim:true},
	time: {type: Date, require: true,default: new Date().toGMTString()}
});

module.exports = user;
var db,
	user,
	link;

db = require('../dbconnection');

link = {
	name: {type: String, require: true, trim: true},
	type: {type: String, require: true, trim: true},
	data: {type: String, require: true, trim: true}
};

user = db.model('setcharts', {
	userid: {type: String, require: true, trim: true},
	username: {type: String, require: true, trim: true},
	name: {type: String, trim: true},
	avatar: {type: String, trim:true},
	main: link,
	links: [link],
	time: {type: Date, require: true,default: new Date().toGMTString()}
});

module.exports = user;
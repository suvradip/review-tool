var db,
	user,
	link,
	review;

db = require('../dbconnection');

review = {
	username: {type: String, require: true, trim: true},
	avatar: {type: String, trim:true},
	review: {type: String, trim: true},
	name: {type: String, trim: true},
	screenshots: {type: String, trim: true},
	chartinfo: {
		width: {type: String, trim: true},
		height: {type: String, trim: true},
		type: {type: String, trim: true},
		buildno: {type: String, trim: true},
		datasource: {type: JSON}
	},
	time: {type: Date, require: true, default: new Date().toGMTString()}
};

link = {
	linkid: {type: String, require: true, trim: true, default:"L-"+new Date().getTime()},
    name: {type: String, require: true, trim: true},
    type: {type: String, require: true, trim: true},
    fname: {type: String, require: true, trim: true},
    description: {type: String, require: true, trim: true},
    reviews: [review]
};

user = db.model('users', {
	userid: {type: String, require: true, trim: true, unique: true},
	username: {type: String, require: true, trim: true, unique: true},
	password: {type: String, require: true, trim: true},
	name: {type: String, trim: true},
	avatar: {type: String, trim:true},
	links: [link],
    main: {type: String, require: true},
	time: {type: Date, require: true, default: new Date().toGMTString()}
});

module.exports = user;
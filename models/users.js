var db,
	user,
	link,
	review,
	linkmap;

db = require('../dbconnection');

/*review = {
	reviewid: {type: String, require: true, trim: true, default:"R-"+new Date().getTime()},
	username: {type: String, require: true, trim: true},
	avatar: {type: String, trim:true},
	review: {type: String, trim: true},
	name: {type: String, trim: true},
	screenshots: {type: String, trim: true},
	isActive : {type: Boolean, default: false},
	chartinfo: {
		width: {type: String, trim: true},
		height: {type: String, trim: true},
		type: {type: String, trim: true},
		buildno: {type: String, trim: true},
		datasource: {type: JSON}
	},
	time: {type: Date, require: true, default: new Date().toGMTString()}
};*/

link = {
	linkid: {type: String, require: true, trim: true},
    name: {type: String, require: true, trim: true},
    type: {type: String, require: true, trim: true},
    fname: {type: String, require: true, trim: true},
    description: {type: String, require: true, trim: true}
};

linkmap = {
	linkid: {type: String, require: true, trim: true },
    reviewid: {type: String, require: true, trim: true },
};


user = db.model('users', {
	userid: {type: String, require: true, trim: true, unique: true},
	username: {type: String, require: true, trim: true, unique: true},
	password: {type: String, require: true, trim: true},
	name: {type: String, trim: true},
	avatar: {type: String, trim:true},
	links: [link],
	reviews: [linkmap],
    main: {type: String, require: true},
    linkid: {type: String, require: true},
	time: {type: Date, require: true, default: new Date().toGMTString()}
});

module.exports = user;
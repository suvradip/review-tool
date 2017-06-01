var db,
	review,
	commnent;

commnent = {
	username: {type: String, require: true, trim: true},
	name: {type: String, trim: true},
	reply: {type: String, trim: true},
	time: {type: Date, require: true,default: new Date().toGMTString()}
};

db = require('../dbconnection');

review = db.model('reviews', {
	reviewid: {type: String, require: true, trim: true},
	linkid: {type: String, require: true, trim: true},
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
});

module.exports = review;


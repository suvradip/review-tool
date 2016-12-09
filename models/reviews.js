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
	username: {type: String, require: true, trim: true},
	avatar: {type: String, trim:true},
	review: {type: String, trim: true},
	name: {type: String, trim: true},
	screenshots: {type: String, trim: true},
	chartinfo: {
		width: {type: String, trim: true},
		height: {type: String, trim: true},
		type: {type: String, trim: true},
		chartjson: {type: JSON},
		buildno: {type: String, trim: true}
	},
	comments: [commnent],
	time: {type: Date, require: true,default: new Date().toGMTString()}
});

module.exports = review;
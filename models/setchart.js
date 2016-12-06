var db,
    setchart,
    link;
db = require('../dbconnection');

link = {
    name: {type: String, require: true, trim: true ,unique:true},
    type: {type: String, require: true, trim: true},
    data: {type: String, require: true, trim: true},
    width: {type: Number, require: true, trim: true},
    height: {type: Number, require: true, trim: true},
    main: {type: Boolean, require: true}
};

setchart = db.model('setchart', {
    userid: {type: String, require: true, trim: true},
    username: {type: String, require: true, trim: true},
    name: {type: String, trim: true},
    main: link,
    links: [link],
    time: {type: Date, require: true,default: new Date().toGMTString()}
});

module.exports = setchart;

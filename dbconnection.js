var mongoose,
	config = require(__dirname+"/config"),
	mongo;

mongoose = require("mongoose");

mongo = config.mongodb;

//console.log("mongodb://" + (mongo.usr ? mongo.usr + ':'+mongo.pwd+'@' : '') + mongo.constr, mongo.options);

mongoose.connect("mongodb://" + (mongo.usr ? mongo.usr + ':'+mongo.pwd+'@' : '') + mongo.constr, mongo.options);
mongoose.Promise = global.Promise;

mongoose.connection.on("error", function(err){console.log("[dbconnection.js] Mongodb: ERROR."+err);});
mongoose.connection.once("open", function(){console.log("[dbconnection.js] Mongodb: Connected.");});

module.exports = mongoose;

var mongoose,
	config = require(__dirname+"/config"),
	mongo;

mongoose = require("mongoose");

mongo = config.mongodb;
console.log("mongodb://" + (mongo.usr ? mongo.usr + ':'+mongo.pwd : '') + mongo.constr);
mongoose.connect("mongodb://" + (mongo.usr ? mongo.usr + ':'+mongo.pwd : '') + mongo.constr);
mongoose.Promise = global.Promise;

mongoose.connection.on("error", function(){console.log("[dbconnection.js] Mongodb: ERROR.");});
mongoose.connection.once("open", function(){console.log("[dbconnection.js] Mongodb: Connected.");});

module.exports = mongoose;
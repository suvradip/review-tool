var mongoose;

mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/fc-review");
mongoose.Promise = global.Promise;

mongoose.connection.on("error", function(){console.log("[dbconnection.js] Mongodb: ERROR.");});
mongoose.connection.once("open", function(){console.log("[dbconnection.js] Mongodb: Connected.");});

module.exports = mongoose;
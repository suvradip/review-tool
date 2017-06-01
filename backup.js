var mongoose;

mongoose = require("mongoose");

mongoose.connect("mongodb://superman:good@127.0.0.1:27017/fc-review",{auth:{authdb:"admin"}});
mongoose.Promise = global.Promise;

mongoose.connection.on("error", function(err){console.log("[dbconnection.js] Mongodb: ERROR."+err);});
mongoose.connection.once("open", function(){console.log("[dbconnection.js] Mongodb: Connected.");});

module.exports = mongoose;

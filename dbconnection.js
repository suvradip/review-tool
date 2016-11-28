var mongoose;

mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/fc-review");
mongoose.Promise = global.Promise;

mongoose.connection.on("error", function(){console.log("Mongodb : ERROR.");});
mongoose.connection.once("open", function(){console.log("Mongodb : Connected.");});

module.exports = mongoose;
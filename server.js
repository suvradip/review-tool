var express,
	app,
	path,
	review;

express = require("express");
path = require("path");
review = require("./models/reviews");

app = express();

app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use('/bower_components', express.static('bower_components'));
app.set('view engine', 'ejs');

app.listen(3000, function(){ console.log('[server.js] Running on port :3000'); });

app.get('/', function(req, res){
	res.render('index');
});

app.get('/api/getreview', function(req, res) {
	var promise;

	promise = review.find();
	promise.then(function(result){
		console.log("[server.js] reviews: Retreived Successfully!");
		res.status(200).json(result).end();
	})
	.catch(function(err){
		console.log("[server.js] reviews: "+err);
	});	
});






// app.get('/test', function(req, res){
// 	var entry,
// 		promise;

// 	entry = new world({
//         "Name": "test",
//         "Population": 5555555,
//         "cities": [
//             {
//                 "Name": "test-t1",
//                 "Population": 44444
//             }]
// 		});	

// 	promise = entry.save();
// 	promise.then(function(){
// 		console.log("world: data inserted");
// 		res.send("ok");
// 	})
// 	.catch(function(err){
// 		console.log("world: Error.");
// 	});
// });



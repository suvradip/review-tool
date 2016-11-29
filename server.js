var express,
	app,
	path,
	bodyParser;

express = require("express");
path = require("path");
bodyParser = require('body-parser');

app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(express.static('public'));
//bower components directory mapping
app.use('/bower_components', express.static('bower_components'));
//angular app directory mapping
app.use('/webapp', express.static('webapp'));

app.use('/api/review', require(__dirname+'/controllers/api/reviews'));
//if port number is changing, also change in gulpfile for browsersync proxy
app.listen(3300, function(){ console.log('[server.js] Running on port :33000'); });

app.get('/', function(req, res){
	res.render('index');
});

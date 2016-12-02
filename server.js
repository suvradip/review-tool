var express,
	app,
	path,
	bodyParser,
	session,
	ENV;

express = require("express");
path = require("path");
bodyParser = require('body-parser');
session = require('express-session');
review = require("./models/reviews");

app = express();

if(process.argv[2] && typeof process.argv[2] !== 'undefined')
	ENV = process.argv[2];

//Here ‘secret‘ is used for cookie handling etc
app.use(session({secret: 'r3v13w-ut1l1ty'}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(express.static('public'));

global.rootdir = __dirname;

//environment setup
if(ENV === '-prod'){
	global.site_root = '/review/';
	console.log('production environment set.');
} else {
	global.site_root = '/';
	console.log('development environment set.');
}

//bower components directory mapping
app.use('/bower_components', express.static('bower_components'));
//angular app directory mapping
app.use('/webapp', express.static('webapp'));

//review page api
app.use('/api/review', require(__dirname+'/controllers/api/reviews'));

//private review page api
app.use('/api/privateReviews', require(__dirname+'/controllers/api/privateReviews'));
//api for create screenshots
app.use('/api/create-screenshot', require(__dirname+'/controllers/imageConstruct'));
//if port number is changing, also change in gulpfile for browsersync proxy
app.listen(3300, function(){ console.log('[server.js] Running on port :3300'); });

app.get('/', function(req, res){
	res.render('index');
});

app.get('/showdata', function(req, res){
	res.render('showdata');
});

app.get('/users/:username', function(req, res){
	var sess = req.session;
	sess.username = req.params.username;
	res.render('editable');
});


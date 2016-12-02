var express,
	app,
	config,
	path,
	bodyParser,
	session,
	mongoStore,
	db;

//load configuaration	
config = require('./config');
express = require("express");
path = require("path");
bodyParser = require('body-parser');
session = require('express-session');
mongoStore = require('connect-mongo')(session);

db = require('./dbconnection');
review = require("./models/reviews");

app = express();

//environment setup
process.env.NODE_ENV = config.env;
global.site_root = config.site_root;

//Here ‘secret‘ is used for cookie handling etc
app.use(session({
	secret: 'r3v13w-ut1l1ty ',
	resave: true,
    saveUninitialized: true,
  	store: new mongoStore({ mongooseConnection: db.connection })
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(express.static('public'));

global.rootdir = __dirname;


if(process.env.NODE_ENV === 'production')
	console.log('production environment set.');
else
	console.log('development environment set.');

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
//api for showdata page
app.use('/api/showdata', require(__dirname+'/controllers/api/showdata'));

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


var express,
	app,
	helmet,
	config,
	path,
	bodyParser,
	session,
	mongoStore,
	db;

//load configuaration	
config = require('./config');
express = require("express");
helmet = require('helmet');
path = require("path");
bodyParser = require('body-parser');
session = require('express-session');
mongoStore = require('connect-mongo')(session);

db = require('./dbconnection');
review = require("./models/reviews");

app = express();
app.use(helmet());
app.disable('x-powered-by');
//environment setup
process.env.NODE_ENV = config.env;
global.site_root = config.host + ':'+ config.port + config.site_root;
//global.site_root = config.site_root;

console.log('site_root :'+ global.site_root);
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
app.use(bodyParser.urlencoded({ extended: false }));
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

//all routes request pass here
app.use('/', require(__dirname+'/controllers/route'));

//if port numbr is changing, also change in gulpfile for browsersync proxy
app.listen(config.port, function(){ console.log('[server.js] Running on port :'+config.port); });

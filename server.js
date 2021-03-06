var express,
	app,
	helmet,
	config,
	path,
	bodyParser,
	session,
	mongoStore,
	createDir,
	directories,
	db;

//load configuaration	
config = require('./config');
express = require("express");
helmet = require('helmet');
path = require("path");
bodyParser = require('body-parser');
session = require('express-session');
mongoStore = require('connect-mongo')(session);
createDir = require(__dirname+'/controllers/createfolders');

db = require('./dbconnection');
review = require("./models/reviews");

app = express();
app.use(helmet());
app.disable('x-powered-by');

//global site root setup from config file
//global.site_root = config.host + ':'+ config.port + config.site_root;
global.site_root = config.site_root;
console.log('site_root :'+ global.site_root);

//Here ‘secret‘ is used for cookie handling etc
app.use(session({
	secret: config.secretKey, //'r3v13w-ut1l1ty',
	//cookie: { maxAge: 60000 * 1 }, // 60 minute
	resave: true,
    saveUninitialized: true,
  	store: new mongoStore({ mongooseConnection: db.connection })
}));

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json({limit:1024*1024*20, type:'application/json'}));
//{ extended:true,limit:1024*1024*20,type:'application/x-www-form-urlencoding' }
app.use(bodyParser.urlencoded({ extended: false  }));
app.use(express.static('public'));

//rootdir delcaration
global.rootdir = __dirname;

//directory creation
directories = config.directory;
for(var path in directories){
	createDir(global.rootdir+ directories[path]);
}	

//environment setup
if(config.env === 'production'){
	process.env.NODE_ENV = config.env;
	console.log('production environment set.');
} else {
	process.env.NODE_ENV = 'development';
	console.log('development environment set.');
}

//bower components directory mapping
app.use('/bower_components', express.static('bower_components'));
//angular app directory mapping
app.use('/webapp', express.static('webapp'));

//all routes request pass here
app.use('/', require(__dirname+'/controllers/route'));

//if port numbr is changing, also change in gulpfile for browsersync proxy
app.listen(config.port, function(){ console.log('[server.js] Running on port :'+config.port); });

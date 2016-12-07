var router = require('express').Router(),
	auth = require(global.rootdir+'/controllers/token'),
	users = require(global.rootdir+'/models/users');

//=======================
//page routing design url
//=======================

//revirew page global
router.get('/', function(req, res){
	var pusername = '',
		pname = '',
		avatar='',
		sess,
		userdata;

	sess = req.session;	
	
	if(sess.token && typeof sess.token !== 'undefined'){
		userdata = auth.decode(sess.token).auth;
		pusername = userdata.username;
		pname = userdata.name;
		avatar = userdata.avatar;
	}

	susername = req.params.username;
	res.render('index', {pusername: pusername, pname: pname, avatar: avatar});
});

//login page
router.get('/login', function(req, res){
	delete req.session.token;
	res.render('login', {pusername: ''});
});



//==========page routing design url=============

//api for login page
router.use('/api/login/', require(global.rootdir+'/controllers/api/login'));

//review page api
router.use('/api/review', require(global.rootdir+'/controllers/api/reviews'));


//=== router middleware to protect this api ====
router.use(require(global.rootdir+'/controllers/auth'));
//=== router middleware END ====




//==== register page after middleware

//personal review page
router.get('/users', function(req, res){
	res.redirect('/users/'+auth.decode(req.session.token).auth.username);
});

router.get('/users/:username', function(req, res){
	//need to work here, temp codes
	var susername,
		pusername,
		pname = '',
		avatar,
		sess,
		userdata;

	sess = req.session;
	
	userdata = auth.decode(sess.token).auth;
	pusername = userdata.username;
	pname = userdata.name;
	avatar = userdata.avatar;
	
	susername = req.params.username;
	req.session.secusername = susername;
	users.findOne({'username': susername})
		.select("main")
		.exec(function(err, result){
			if(err) console.log('[router.js] :'+ err);
			if(result)
				res.render('maincharts', {susername: susername, jsfname: result.main, pusername: pusername, pname: pname, avatar: avatar});
			else 
				res.render('maincharts', {susername: susername, jsfname: '', pusername: pusername, pname: pname, avatar: avatar});		

		}); 	
});


//showdata page
router.get('/showdata', function(req, res){
	res.render('showdata');
});

router.get('/users/:username/setchart', function(req, res){
	//var pusername;
	//pusername = auth.decode(req.session.token).auth.username;
	var pusername,
		pname = '',
		avatar,
		sess,
		userdata;

	sess = req.session;
	
	userdata = auth.decode(sess.token).auth;
	pusername = userdata.username;
	pname = userdata.name;
	avatar = userdata.avatar;

	res.render('setchart', {pusername: pusername, pname: pname, avatar: avatar});
});

//==== register page after middleware


//====================
//	API Links register
//====================

// //review page api
// router.use('/api/review', require(global.rootdir+'/controllers/api/reviews'));
//private review page api
router.use('/api/privateReviews', require(global.rootdir+'/controllers/api/privateReviews'));
//api for create screenshots
router.use('/api/create-screenshot', require(global.rootdir+'/controllers/imageConstruct'));
//api for showdata page
router.use('/api/showdata', require(global.rootdir+'/controllers/api/showdata'));
//api for showdata page
router.use('/api/showdata', require(global.rootdir+'/controllers/api/showdata'));
//api for chart setup
router.use('/api/chartsetup', require(global.rootdir+'/controllers/api/chartsetup'));

//==========API Links register END==============

module.exports = router;
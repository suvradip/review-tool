var router = require('express').Router(),
	auth = require(global.rootdir+'/controllers/token'),
	users = require(global.rootdir+'/models/users');

//=======================
//page routing design url
//=======================

//revirew page global
router.get('/', function(req, res){
	var pusername = '',
		sess;

	sess = req.session;	
	if(sess.token && typeof sess.token !== 'undefined')
		pusername = auth.decode(sess.token).auth.username;

	susername = req.params.username;
	res.render('index', {pusername: pusername});
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
		pusername;

	pusername = auth.decode(req.session.token).auth.username;
	susername = req.params.username;

	req.session.secusername = susername;
	users.findOne({'username': susername})
		.select("main")
		.exec(function(err, result){
			if(err) {
				console.log('[router.js] :'+ err);
				res.render('maincharts', {susername: susername, fname: '', pusername:  pusername});		
			}
			res.render('maincharts', {susername: susername, fname: result.main, pusername:  pusername });						
		}); 	
});


//showdata page
router.get('/showdata', function(req, res){
	res.render('showdata');
});

router.get('/users/:username/setchart', function(req, res){
	var pusername;
	pusername = auth.decode(req.session.token).auth.username;
	res.render('setchart', {pusername: pusername});
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
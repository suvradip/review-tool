var router = require('express').Router();

//=======================
//page routing design url
//=======================

//revirew page global
router.get('/', function(req, res){
	res.render('index');
});


router.get('/users/:username', function(req, res){
	var sess = req.session;
	sess.username = req.params.username;
	res.render('editable');
});

//login page
router.get('/login', function(req, res){
	delete req.session.token;
	res.render('login');
});

//==========page routing design url=============

//api for login page
router.use('/api/login/', require(global.rootdir+'/controllers/api/login'));




//=== router middleware to protect this api ====
router.use(require(global.rootdir+'/controllers/auth'));
//=== router middleware END ====




//==== register page after middleware

//showdata page
router.get('/showdata', function(req, res){
	res.render('showdata');
});

// router.get('/users/:username/setchart', function(req, res){
// 	var sess = req.session;
// 	sess.username = req.params.username;
// 	res.render('setchart');
// });

//==== register page after middleware


//====================
//	API Links register
//====================

//review page api
router.use('/api/review', require(global.rootdir+'/controllers/api/reviews'));
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
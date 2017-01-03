var router = require('express').Router(),
	auth = require(global.rootdir+'/controllers/token'),
	users = require(global.rootdir+'/models/users'),
	config = require(global.rootdir+'/config.json'),
	_ = require("lodash"),
	findLink;

	findLink = function(links, name){
		var res;
	    res = _.find(links, {linkid: name});
	    return (res && typeof res !== "undefined".type) ? res.type : '';
	};


//=============================
// Design urls for page routing
//=============================


//revirew page global
router.get('/', function(req, res){
	// var pusername = '',
	// 	pname = '',
	// 	avatar='',
	// 	sess,
	// 	userdata;

	// sess = req.session;	
	
	// if(sess.token && typeof sess.token !== 'undefined'){
	// 	userdata = auth.decode(sess.token).auth;
	// 	pusername = userdata.username;
	// 	pname = userdata.name;
	// 	avatar = userdata.avatar;
	// }

	// susername = req.params.username;
	// res.render('index', {pusername: pusername, pname: pname, avatar: avatar});
	res.redirect(config.site_root+'login/');
});

//login page
router.get('/login', function(req, res){
	delete req.session.token;
	res.render('login', {pusername: ''});
});


//====================================
// Normal design url for page routing
// ===================================

//api for login page
router.use('/api/login/', require(global.rootdir+'/controllers/api/login'));

//review page api
router.use('/api/review', require(global.rootdir+'/controllers/api/reviews'));

//api for create screenshots
router.use('/api/create-screenshot', require(global.rootdir+'/controllers/imageConstruct'));


//====================================================================
// A middleware to protect some urls which need proper authentications
// ===================================================================

router.use(require(global.rootdir+'/controllers/auth'));

// END of middleware



//================================================
// registration of page url after the middleware
// ===============================================

//personal review page
router.get('/users', function(req, res){
	res.redirect(config.site_root+'users/'+auth.decode(req.session.token).auth.username);
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
		.select({main:1, linkid:1, links:1, _id:0})
		.exec(function(err, result){
			if(err) console.log('[router.js] :'+ err);

			if(result.links.length > 0){
				//console.log(result);
				res.render('maincharts', {linkid:result.linkid, ctype: findLink(result.links, result.linkid), susername: susername, jsfname: result.main || '', pusername: pusername, pname: pname, avatar: avatar});
			} else { 
				res.redirect(config.site_root+'users/'+ pusername +'/setchart');	
			}

		}); 	
});


//showdata page
router.get('/showdata', function(req, res){
	var sess = req.session,
		usrdata;
	usrdata = auth.decode(sess.token).auth;	
	res.render('showdata', {ctype:"", pusername: usrdata.username, pname: usrdata.name, avatar: usrdata.avatar});
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

	res.render('setchart', {ctype:"", pusername: pusername, pname: pname, avatar: avatar});
});

//end of registration


//====================
//	API Links register
//====================

// //review page api
// router.use('/api/review', require(global.rootdir+'/controllers/api/reviews'));
//private review page api
router.use('/api/privateReviews', require(global.rootdir+'/controllers/api/privateReviews'));
//api for showdata page
router.use('/api/showdata', require(global.rootdir+'/controllers/api/showdata'));
//api for showdata page
router.use('/api/showdata', require(global.rootdir+'/controllers/api/showdata'));
//api for chart setup
router.use('/api/chartsetup', require(global.rootdir+'/controllers/api/chartsetup'));

//==========API Links register END==============

module.exports = router;
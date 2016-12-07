var auth,
	jwt = require('jwt-simple'),
  config = require(global.rootdir+'/config');

auth = function(req, res, next){
	var sess = req.session,
		token;
	token = sess.token || req.headers['x-auth'];

	if(token && typeof token !== 'undefined') {
        try {
            auth = jwt.decode(token, config.secretKey);
            next();
        } catch(err) {
            if(err) { return  res.status(401).send('authentication: invalid signature.' + err).end(); }
        } 
	} else {
		return res.status(403).send({ 
	        success: false, 
	        message: 'No token provided.' 
    	});
	}
};

module.exports = auth;
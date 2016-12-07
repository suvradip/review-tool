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
            res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    		res.header('Expires', '-1');
    		res.header('Pragma', 'no-cache');
            next();
        } catch(err) {
            if(err) { return  res.status(401).send('authentication: invalid signature.' + err).end(); }
        } 
	} else {
		return res.status(403).send({ 
	        success: false, 
	        message: 'No token provided. please login again' 
    	});
	}
};

module.exports = auth;
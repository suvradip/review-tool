var auth,
	jwt = require('jwt-simple'),
    bcrypt = require('bcrypt'),
    config = require(global.rootdir+'/config');

auth = function(req, res, next){
	var sess = req.session,
		token;
	token = sess.token || req.headers['x-auth'];
	req.session.token = token; //remove this line code   
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
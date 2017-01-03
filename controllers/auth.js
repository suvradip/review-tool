var auth,
	jwt = require('jwt-simple'),
  config = require(global.rootdir+'/config');

auth = function(req, res, next){
	var sess = req.session,
		token;
	token = sess.token || req.headers['x-auth'];
    //console.log(token);
	if(token && typeof token !== 'undefined') {
        try {
            auth = jwt.decode(token, config.secretKey);
            //res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    		//res.header('Expires', new Date(Date.now() + config.tokenTime)); //15 MINTS
    		//res.header('Pragma', 'no-cache');

            auth.exp =  Date.now() + config.tokenTime;
            // console.log("curr ->" + new Date(auth.nbf));
            // console.log("Exp ->" + new Date(auth.exp));
            token = jwt.encode(auth, config.secretKey);
            req.session.token = token;
            next();
        } catch(err) {
            if(err) { return  res.status(401).send('authentication: signature expired, please login again.' ).end(); }
        } 
	} else {
		return res.status(403).send({ 
	        success: false, 
	        message: 'No token provided. please login again' 
    	});
	}
};

module.exports = auth;
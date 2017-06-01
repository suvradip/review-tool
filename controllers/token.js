var auth,
	encode,
	decode,
	jwt = require('jwt-simple'),
    config = require(global.rootdir+'/config');

decode = function(token){
	   
	if(token && typeof token !== 'undefined') {
        try {
            auth = jwt.decode(token, config.secretKey);
            return { success: true,  auth: auth };
        } catch(err) {
            return err;
        } 
	} else {
		return {success: false, message: 'No token provided.'};
	}
};

encode = function(content){
	if(content && typeof content !== 'undefined'){
		try{
			auth = jwt.encode(content, config.secretKey);
		    return { success: true,  auth: auth };
		} catch(err) {
			return err;
		}
	} else {
		return { success: false,  message: 'No contents provided.' };
	}
};

module.exports = {decode: decode, encode: encode};
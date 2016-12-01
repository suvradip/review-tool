module.exports = function (req,	res,	next)	{

		if	(req.auth && typeof req.auth !== 'undefined')
			req.auth =	req.auth;
		next();
};
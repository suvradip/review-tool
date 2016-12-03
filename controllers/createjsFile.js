var fs,
	data,
	router,
	dirlocation;

router = require('express').Router();
fs = require('fs');
dirlocation = global.rootdir +'/public/scripts/users/';

router.post('/', function(req, res){
	data = req.body.data;
	name = req.body.name;
	
	fs.writeFile(dirlocation+name, binaryData, "utf-8", function(err) {
	    if(err){ console.log('[createjsFile.js] Error: '+err); }
	    else {
	    	console.log('[createjsFile.js] Successfully js-file saved.');
	    }
	});
	res.status(200).end();
});

module.exports = router;
var fs,
	data,
	base64Data,
	binaryData,
	construct,
	router,
	dirlocation;

router = require('express').Router();
fs = require('fs');
dirlocation = global.rootdir +'/public/screenshots/';

router.post('/', function(req, res){
	data = req.body.data;
	name = req.body.name;
	base64Data  =   data.replace(/^data:image\/png;base64,/, "");
	base64Data  +=  base64Data.replace('+', ' ');
	binaryData  =   new Buffer(base64Data, 'base64').toString('binary');

	fs.writeFile(dirlocation+name, binaryData, "binary", function(err) {
	    if(err){ console.log('[imageConstruct.js] Error: '+err); }
	    else {
	    	console.log('[imageConstruct.js] Successfully image saved.');
	    }
	});
	res.status(200).end();
});

module.exports = router;
var router = require('express').Router(),
    user = require(global.rootdir+'/models/users');

router.get('/', function (req, res) {
    var entries,
        projection = {"links.reviews" :1},
        query = {};

    //entries = user.find(query, projection);
    entries = user.distinct("links.reviews");
    entries.then(function (result) {
        console.log('[showdata.js] Retreived Successfully!');
        res.status(200).json(result).end();
    })
    .catch(function (err) {
        console.log('[showdata.js] Retreive Failed!');
        console.log(err);
        res.status(404).end();
    });

});

module.exports = router;
var router = require('express').Router(),
    review = require('../../models/reviews');

router.post('/', function(req, res, next) {  
    var entry,
        promise,
         timeNow = new Date().getTime();
        
        entry = new review({
            username: 'pid' + timeNow,
            review: req.body.review,
            avatar: req.body.avatar,
            name: req.body.name || 'anonymous',
            screenshots: req.body.ssid,
            chartjson: req.body.chartdata
        });

        promise = entry.save();
        promise.then(function() {
            console.log('[review.js] Inserted Successfully!');
            res.status(200).end();
        })
        .catch(function (err) {
            console.log('[review.js] Failed Insertion!');
            console.log(err);
            res.status(404).end();
        });
});

router.get('/', function (req, res) {
    var entries,
        i,
        id = req.query.id,
        keys = req.query.keys,
        keyNames = keys && keys.split(','),
        projection = {},
        query = {};

    if(id !== undefined)
    	query.productId = id;
    
    if (keys !== undefined) {
        for (i = 0; i < keyNames.length; i++) {
            projection[keyNames[i]] = 1;
        }
    }

    entries = review.find(query, projection);

    entries.then(function (result) {
        console.log('[review.js] Retreived Successfully!');
        res.status(200).json(result).end();
    })
    .catch(function (err) {
        console.log('[review.js] Retreive Failed!');
        console.log(err);
        res.status(404).end();
    });
});

module.exports = router;
var router = require('express').Router(),
    review = require('../../models/reviews');

router.post('/', function(req, res, next) {  
    var entry,
        promise,
         timeNow = new Date().getTime();
        
        entry = new review({
            username: 'anonymous',
            review: req.body.review,
            avatar: req.body.avatar,
            name: req.body.name || 'anonymous name',
            screenshots: req.body.ssid,
            chartinfo: {
                type: req.body.chartinfo.type,
                width: req.body.chartinfo.width,
                height: req.body.chartinfo.height,
                buildno: req.body.chartinfo.build
            },
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
        projection = {},
        query = {};

    query = {username: 'anonymous'};    
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
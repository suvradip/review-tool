var router = require('express').Router(),
    review = require('../../models/reviews');


router.post('/', function(req, res, next) {  
    var sess = req.session,
        entry,
        promise,
        timeNow = new Date().getTime();
    
    if(sess.username && typeof sess.username !== 'undefined') {    
        entry = new review({
            username: sess.username,
            review: req.body.review,
            avatar: req.body.avatar,
            name: sess.username || 'anonymous name',
            screenshots: req.body.ssid,
            chartjson: req.body.chartdata
        });

        promise = entry.save();
        promise.then(function() {
            console.log('[privateReviews.js] Inserted Successfully!');
            res.status(200).end();
        })
        .catch(function (err) {
            console.log('[privateReviews.js] Failed Insertion!');
            console.log(err);
            res.status(404).end();
        });
    }    
});


router.get('/', function (req, res) {
    var sess = req.session,
        entries,
        projection = {},
        query = {};

    if(sess.username && typeof sess.username !== 'undefined') {
        query = {username: sess.username };
        entries = review.find(query, projection);

        entries.then(function (result) {
            console.log('[privateReviews.js] Retreived Successfully!');
            res.status(200).json({username: sess.username, data:result}).end();
        })
        .catch(function (err) {
            console.log('[privateReviews.js] Retreive Failed!');
            console.log(err);
            res.status(404).end();
        });
    } else {
       res.status(404).end();
    }
});

module.exports = router;
var router = require('express').Router(),
    review = require('../../models/reviews');

router.get('/', function (req, res) {
    var entries,
        projection = {},
        query = {};

    entries = review.find(query, projection);

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
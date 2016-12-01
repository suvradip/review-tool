var router = require('express').Router(),
    review = require('../../models/reviews');



router.get('/:username', function (req, res) {
    var entries,
        projection = {},
        query = {};

    query = {
        username: req.params.username
    };

    // if (keys !== undefined) {
    //     for (i = 0; i < keyNames.length; i++) {
    //         projection[keyNames[i]] = 1;
    //     }
    // }

    console.log(projection);
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
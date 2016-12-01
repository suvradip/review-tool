var router = require('express').Router(),
    review = require('../../models/users');

router.post('/', function(req, res, next) {  
    var entry,
        promise,
        timeNow = new Date().getTime();
        
        entry = new review({
            userid: 'pid' + timeNow,
            username: req.body.username,
            name: req.body.name,
            avatar: req.body.avatar
        });

        promise = entry.save();
        promise.then(function() {
            console.log('[users.js] Inserted Successfully!');
            res.status(200).end();
        })
        .catch(function (err) {
            console.log('[users.js] Failed Insertion!');
            console.log(err);
            res.status(404).end();
        });
});

router.get('/:username', function (req, res) {
    require('./auth');
    res.send(req.params.username);

});

module.exports = router;
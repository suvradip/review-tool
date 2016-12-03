var router = require('express').Router(),
    users = require('../../models/users');

router.post('/', function(req, res, next) {  
    var entry,
        promise,
        timeNow = new Date().getTime();
        
        entry = new users({
            userid: 'pid' + timeNow,
            username: req.body.username,
            name: req.body.name,
            avatar: req.body.avatar,
            main: req.body.link.data,
            links: req.body.link
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

  

       // res.send('sss12');
});

router.get('/', function (req, res) {
    
   var entries,
        projection = {},
        query = {};

    query = {username: 'ssa'};    
    entries = users.find(query, projection);

    entries.then(function (result) {
        console.log('[users.js] Retreived Successfully!');
        console.log(result);
        res.status(200).send(result).end();
    })
    .catch(function (err) {
        console.log('[users.js] Retreive Failed!');
        console.log(err);
        res.status(404).end();
    });
   //res.send('sss');
});

module.exports = router;
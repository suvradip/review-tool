var router = require('express').Router(),
    setchart = require('../../models/setchart');

router.post('/:username/setchart', function(req, res, next) {  
    var entry,
        promise,
        username = req.params.username,
        timeNow = new Date().getTime();

    // if(setchart.findOne({'username':username}) ){
    //     res.send(req.params);
    // }    

    promise = setchart.findOne({'username':username});
    promise.then(function(r) {
    var link_data = {
                        name: req.body.link.name, 
                        type: req.body.link.type,
                        data: req.body.link.data,
                        width: req.body.link.width,
                        height: req.body.link.height,
                        main: req.body.link.main
                    };
                    console.log(r);         
            if(r){
                promise = setchart.update(
                            { username: r.username }, 
                            { $push: { links: link_data }}
                        );

            }
            else{

                entry = new setchart({
                    userid : 'pid' + timeNow,
                    username : req.params.username,
                    name : req.body.name || 'anonymous name',
                    avatar : req.body.avatar || 'avatar.png',
                    main : link_data,
                    links : [link_data]             
                });
        
            promise = entry.save();
            }

            promise.then(function() {
                    console.log('[users.js] Inserted Successfully!');
                    res.status(200).end();
                })
                .catch(function (err) {
                    console.log('[users.js] Failed Insertion!');
                    console.log(err);
                    res.status(404).end();
                });

            res.send(r);
           // res.send(username);
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
var router = require('express').Router(),
    users = require(global.rootdir+'/models/users'),
    auth = require(global.rootdir+'/controllers/token'),
    _ = require('lodash'),
    findLink;

findLink = function(links, name){
    return _.find(links, {name: name});
};

router.post('/', function(req, res, next) {  
    var token,
        entry,
        promise,
        username,
        timeNow = new Date().getTime();

    token = auth.decode(req.session.token);
    
    if(token.success) {
        username = token.auth.username;

        promise = users.findOne({'username':username});
        promise.then(function(r) {
                var link_data,
                    promise2,
                    linkdata;

                link_data = {   
                    name: req.body.name, 
                    fname: req.body.fname,
                    type: req.body.type,
                    main: req.body.main
                };
                
                linkdata = findLink(r.links, link_data.name);
                if(linkdata && typeof linkdata === 'undefined'){
                    promise2 = users.update(
                        { username: r.username }, 
                        { $push: { links: link_data }}
                    );
                     
                    promise2.then(function() {
                        console.log('[chartsetup.js] updated successfully!');
                        res.status(200).send({success: true, message: 'data update.'}).end();
                    })
                    .catch(function (err) {
                        console.log('[chartsetup.js] failed updation!');
                        console.log(err);
                        res.status(404).end();
                    });
                } else {
                    res.status(200).send({success: false, message: 'Link alredy exists', linkdata: linkdata}).end();
                }    
        })
        .catch(function (err) {
            console.log('[chartsetup.js] failed lookup!');
            console.log(err);
            res.status(404).end();
        });
    }    
});

router.get('/', function (req, res) {
    var token,
        promise,
        username,
        timeNow = new Date().getTime();

    token = auth.decode(req.session.token);
    
    if(token.success) {
        username = token.auth.username;
        users.findOne({username: username})
            .select({'links': 1, _id: 0 })
            .exec(function (err, result) {
                res.status(200).send(result).end();
            });

    }    
});

module.exports = router;
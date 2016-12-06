var router = require('express').Router(),
    users = require(global.rootdir+'/models/users'),
    auth = require(global.rootdir+'/controllers/token'),
    config = require(global.rootdir+'/config'),
    _ = require('lodash'),
    findresult;

findresult = function(collection, obj){
    return _.find(collection, obj);
};

router.post('/', function(req, res, next) {  
    var entry,
        promise,
        timeNow = new Date().getTime(),
        user,
        user1,
        review,
        secusername;
        
        user = auth.decode(req.session.token).auth;
        secusername = req.session.secusername;

        review = {
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            review: req.body.review,
            screenshots: req.body.ssid,
            chartinfo: {
                type: req.body.chartinfo.type,
                width: req.body.chartinfo.width,
                height: req.body.chartinfo.height,
                buildno: req.body.chartinfo.build,
                data: req.body.chartinfo.datasource
            },
        };

        // need edit    
        // entry = new users({
        //     username: 'anonymous',
        //     review: req.body.review,
        //     avatar: req.body.avatar,
        //     name: req.body.name || 'anonymous name',
        //     screenshots: req.body.ssid,
        //     chartinfo: {
        //         type: req.body.chartinfo.type,
        //         width: req.body.chartinfo.width,
        //         height: req.body.chartinfo.height,
        //         buildno: req.body.chartinfo.build
        //     },
        //     chartjson: req.body.chartdata
        // });

        users.findOne({username: secusername})
            .select({main:1, username:1})
            .exec(function(err, result){
                if(err) console.log(err);
                if(result){
                    promise = users.update({username: result.username, 'links.name': result.main}, 
                        {$push: {'links.$.reviews':  review }});

                    promise.then(function() {
                        console.log('[review.js] updated successfully!');
                        var obj,
                            d;
                        d = new Date();

                        obj = user;
                        obj.review = review.review;
                        obj.ssid = review.screenshots;
                        obj.time = d.toLocaleTimeString();
                        obj.date = d.toLocaleDateString();
                        console.log(obj);
                        res.status(200).send({success:true, obj: obj}).end();
                    })
                    .catch(function (err) {
                        console.log('[review.js] Failed updation!');
                        console.log(err);
                        res.status(404).end();
                    });
                } else {
                    res.status(200).json({success: false, message: 'no users found.'}).end();
                }
            });
        //end edit need
        
});

router.get('/:username', function (req, res) {
    var entries,
        username,
        projection,
        query;
    
    username = req.params.username;
    query = {username: username};    
    projection = {};
    //entries = review.find(query, projection);

    users.findOne(query)
        .select({main: 1, links: 1, _id: 0})
        .exec(function(err, result) {
            if(result) {
                
                var reviews;   
                if(err) console.log(err);
                result = findresult(result.links, {"name": result.main});
                res.status(200).json({success: true, result: result}).end();
            } else {

                res.status(200).json({success: false, message: 'no users found.'}).end();
            }    
        });

    // entries.then(function (result) {
    //     console.log('[review.js] Retreived Successfully!');
    //     res.status(200).json(result).end();
    // })
    // .catch(function (err) {
    //     console.log('[review.js] Retreive Failed!');
    //     console.log(err);
    //     res.status(404).end();
    // });
});

module.exports = router;
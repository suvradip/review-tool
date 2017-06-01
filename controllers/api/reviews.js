var router = require('express').Router(),
    users = require(global.rootdir+'/models/users'),
    reviews = require(global.rootdir+'/models/reviews'),
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
            reviewid: "RR-"+new Date().getTime(),
            linkid: req.body.linkid,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            review: req.body.review,
            screenshots: req.body.ssid,
            isActive: false,
            chartinfo: {
                type: req.body.chartinfo.type,
                width: req.body.chartinfo.width,
                height: req.body.chartinfo.height,
                buildno: req.body.chartinfo.build,
                datasource: req.body.chartinfo.datasource
            },
        };

        // need edit    
        entry = new reviews(review);

        /*users.findOne({username: secusername})
            .select({main:1, username:1})
            .exec(function(err, result){
                if(err) console.log(err);
                if(result){
                    promise = users.update({username: result.username, 'links.fname': result.main}, 
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
            });*/
        //end edit need
        
        promise = entry.save();
        promise.then(function(result){
            console.log(result);
            console.log('[review.js] new review inserted.');
            var obj,
                d;
            d = new Date();

            obj = user;
            obj.review = review.review;
            obj.ssid = review.screenshots;
            obj.time = d.toLocaleTimeString();
            obj.date = d.toLocaleDateString();
           // console.log(obj);
            /*users.update({username: user.username}, {$push: {'reviews':  { linkid: req.body.linkid, reviewid: result.reviewid} } })
                .exec(function(err, result){
                    if(err) console.log("error");

                    console.log("updated");
                });*/
            res.status(200).send({success:true, obj: obj}).end();
        })
        .catch(function(err){
            console.log('[review.js] insertion Failed!');
            res.status(200).json({success: false, message: 'no users found.'}).end();
        });
        
});

router.get('/:linkid', function (req, res) {
    var entries,
        linkid,
        projection,
        query;
    
    linkid = req.params.linkid;
    query = {linkid: linkid};    
    projection = {avatar:1, username:1, review:1};
    //entries = review.find(query, projection);

    reviews.find(query)
        .select({avatar: 1, review:1, time:1, name:1, username:1, screenshots:1, isActive:1, _id: 0})
        .exec(function(err, result) {
            if(result) {
                
                //var reviews;   
                if(err) console.log(err);
                //result = findresult(result.links, {"fname": result.main});
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

router.post('/update/:reviewid', function(req, res){
    var reviewid,
        flag;

    reviewid = req.params.reviewid;    

    promise = reviews.update({reviewid: reviewid}, {$set: {isActive: true}});
    promise.then(function() {
        console.log('[review.js] updated successfully!');
        // var obj,
        //     d;
        // d = new Date();

        // obj = user;
        // obj.review = review.review;
        // obj.ssid = review.screenshots;
        // obj.time = d.toLocaleTimeString();
        // obj.date = d.toLocaleDateString();
        // console.log(obj);
        res.status(200).send({success:true}).end();
    })
    .catch(function (err) {
        console.log('[review.js] Failed updation!');
        console.log(err);
        res.status(404).end();
    });
            
});

//global user

router.post('/global', function(req, res){
    var entry,
        promise,
        timeNow = new Date().getTime(),
        username,
        review,
        token = {},
        sess;
        
        sess = req.session;

        if(typeof sess.token !== "undefined" && sess.token) {
            token = auth.decode(req.session.token).auth;
            username = token.username;
        } else {
            username = "anonymous";
        }

        review = {
            username: username,
            name: token.name || req.body.name,
            avatar: token.avatar || req.body.avatar,
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

        entry = new reviews(review);
        promise = entry.save();

        promise.then(function(){
            res.status(200).json({success: true, message: 'data inserted.'}).end();
        })
        .catch(function(){

        });
});

router.get('/global', function(req, res){
    var projection,
        promise,
        query;

    username = req.params.username;
    query = {};    
    projection = {};
    //entries = review.find(query, projection);

    promise = reviews.find(query);
        
    promise.then(function(result) {
        res.status(200).json({success: true, result: result}).end();
    })
    .catch(function(err){
        console.log(err);
    });
});

module.exports = router;
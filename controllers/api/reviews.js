var router = require('express').Router(),
    users = require(global.rootdir+'/models/users'),
    _ = require('lodash'),
    findresult;

findresult = function(collection, obj){
    return _.find(collection, obj);
};

router.post('/', function(req, res, next) {  
    var entry,
        promise,
         timeNow = new Date().getTime();
        
        // need edit    
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

        
        promise = users.update({username: 'ssa', 'links.name': 'demo-12'}, 
                        {$push: {'links.$.reviews':  {review: 'grt cool'}}});
        //end edit need
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
                res.status(200).json({success: true, result: result.reviews}).end();
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
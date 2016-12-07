var router = require('express').Router(),
    fs = require('fs'),
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
                    linkdata,
                    codeblock;

                link_data = {   
                    name: req.body.name, 
                    fname: req.body.fname,
                    type: req.body.type
                };

                codeblock = req.body.main;
                codeblock = codeblock.replace(/[\n]/i, '');
                codeblock = codeblock.replace(/[\']/i, '\'');
                codeblock = codeblock.replace(/[\"]/i, '"');

                fs.writeFile(global.rootdir+'/public/fc.charts.resource/'+link_data.fname, codeblock, 'utf-8', function(){
                    console.log('[chartsetup.js] file writing doene.');
                });
             
                if(r.links.length > 0) {
                    linkdata = findLink(r.links, link_data.name);
                    if(linkdata && typeof linkdata !== 'undefined'){
                       return res.status(200).send({success: false, message: 'Link alredy exists', linkdata: linkdata}).end();
                    }                        
                }  
                
                promise2 = users.update(
                    { username: r.username }, 
                    { 
                        $push: { links: link_data },
                        $set: { main: link_data.fname} 
                    }
                );
                
                users.update({username: r.username}, {$set: {main: link_data.fname}});

                promise2.then(function() {
                    console.log('[chartsetup.js] updated successfully!');
                    res.status(200).send({success: true, message: 'data update.'}).end();
                })
                .catch(function (err) {
                    console.log('[chartsetup.js] failed updation!');
                    console.log(err);
                    res.status(404).end();
                });
                  
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

router.get('/getlinks', function(req, res){
    var promise,
        token,
        link_name,
        query,
        select;

    token = auth.decode(req.session.token).auth;
    query = {username: token.username };
    select = {links: 1, _id: 0 }; 

    if(req.query.link_name && typeof req.query.link_name !== 'undefined'){
        query["links.name"] = req.query.link_name;        
    }
    
    users.findOne(query)
        .select(select)
        .exec(function(err, result){
            if(err) console.log('[chartsetup.js] : error:'+err);
            if(result) {
                res.status(200).send({success: true, result: result}).end();
            } else {
                res.status(200).send({success: false, message: 'no data found'}).end();
            }
        });
    
});

module.exports = router;
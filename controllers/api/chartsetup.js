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
                    type: req.body.type,
                    description: req.body.description,
                    update: req.body.update
                };

                codeblock = req.body.filecontents;
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
                
                promise2 = users.update({ username: r.username }, {$push: { links: link_data } });

                console.log('set-chart');
                console.log(link_data);
                if(link_data.update){
                    users.update({username: r.username}, {$set: {main: link_data.fname}});
                }

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
    select = { _id:0, "links.linkid": 1, "links.name": 1, "links.fname": 1}; 

    if(Object.keys(req.query).length > 0){
        for(var _key in req.query) {
            query["links."+_key] = req.query[_key];
        }
        //query["links.name"] = req.query.link_name;
        select = { _id:0, reviews:0, time:0, "links.reviews":0, links: { $elemMatch: req.query }}; 
    }
   
    promise = users.findOne(query, select);
    promise.then(function(result) {
        console.log('[chartsetup.js] retrived successfully!');
        res.status(200).send({success: true, result: result}).end();
    })
    .catch(function (err) {
        console.log('[chartsetup.js] failed data retrived!');
        console.log(err);
        res.status(404).end();
    });
});

router.post('/updatelinks', function(req, res){
    var token,
        promise,
        username,
        linkid,
        linkdata,
        codeblock;

    token = auth.decode(req.session.token);
    linkid = req.body.linkid;

    linkdata = {   
        name: req.body.name, 
        type: req.body.type,
        description: req.body.description,
        update: req.body.update
    };

    codeblock = req.body.filecontents;
    codeblock = codeblock.replace(/[\n]/i, '');
    codeblock = codeblock.replace(/[\']/i, '\'');
    codeblock = codeblock.replace(/[\"]/i, '"');

    username = token.auth.username;
    
    users.findOne({'username':username, 'links.linkid': linkid}, {"links.$.likid": linkid})
        .select({"links.fname" : 1, main:1, "links.linkid":1})
        .exec(function(err, result){
            var fname;
            if(err) {console.log(err); return;}

            fname = result.links[0].fname;
            
            console.log('update-chart');
            console.log(result.links.length);
            console.log(fname);
            console.log(linkdata);

            fs.writeFile(global.rootdir+'/public/fc.charts.resource/'+fname, codeblock, 'utf-8', function(){
                console.log('[chartsetup.js] file writing done.');
            });
         
            if(linkdata.update) {
                console.log('--->');
                var p = users.update({'username':username, 'links.linkid': linkid},{
                    $set: {main: fname }
                });

                p.then(function(){
                    console.log("success");
                })
                .catch(function(err){
                    console.log(err);
                });
            }

            promise = users.update({'username':username, 'links.linkid': linkid}, { 
                $set: { 
                    "links.$.name": linkdata.name,
                    "links.$.type": linkdata.type,
                    "links.$.description": linkdata.description
                }
            });
            
            promise.then(function() {
                console.log('[chartsetup.js] updated successfully!');
                res.status(200).send({success: true, message: 'data update.'}).end();
            })
            .catch(function (err) {
                console.log('[chartsetup.js] failed updation!');
                console.log(err);
                res.status(404).end();
            });
        });   
});
module.exports = router;

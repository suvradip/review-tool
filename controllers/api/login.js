 var router = require('express').Router(),
    jwt = require('jwt-simple'),
    bcrypt = require('bcrypt-nodejs'),
    config = require(global.rootdir+'/config'),
    user = require(global.rootdir+'/models/users');

router.post('/validate', function(req, res, next) {  
    var username,
        password,
        token;

    username = req.body.username;
    password = req.body.password;

    user.findOne({username: username})
        .select({'password': 1, avatar: 1, name: 1, main: 1, _id: 0})
        .exec(function (err, result) {
            if  (err) { return next(err); }
            if  (!result) { return  res.send(401); }
            
            bcrypt.compare(password, result.password, function (err, valid) {
                if(err) { return  next(err); }
                if(!valid) { return res.send(401); }

                token = jwt.encode({username: username, avatar: result.avatar, name: result.name}, config.secretKey);
                req.session.token = token;
                res.type("html");
                res.status(200).redirect(config.site_root+'/users/'+username);
            });
        });
});


router.get('/user', function (req, res){
        var token,
            auth;

        token = req.session.token || req.headers['x-auth'];
       
        try {
            auth = jwt.decode(token, config.secretKey);
            user.findOne({username: auth.username})
                .select({username: 1, avatar: 1, name: 1, _id: 0})
                .exec(function (err, user){
                    if(err) { return  res.status(401).send(err).end(); }
                    if(user)
                        res.json(user);
                    else
                        res.status(401).send('something wents wrong.');
                });                   
        } catch(err) {
            if(err) { return  res.status(401).send('invalid signature.').end(); }
        } 
});


router.post('/createuser', function (req, res, next) {
    var password,
        key,
        promise,
        entry,
        data,
        salt,
        timeNow = new Date().getTime();
    
    key = req.body.key;
    if(!key || key !== config.secretKey || key == '')
        return res.status(401).send('supekey missmatch').end();

    if(typeof req.body.username === "undefined" || typeof req.body.password === "undefined" )
        return res.status(401).send('username/password is missing.').end();

    data = {
        username: req.body.username,
        name: req.body.name || '',
        avatar: req.body.avatar || 'avatar.png',
        userid: 'p'+timeNow
    };

    password = req.body.password;
    entry = new user(data);
    salt = bcrypt.genSaltSync(10);
    bcrypt.hash(password, salt, null, function (err, hash) {
        entry.password = hash;
        
        promise = entry.save();
        promise.then(function() {
            console.log('[login.js] Inserted Successfully!');
            data.password = password;
            res.status(404).json({success: true, message: 'user created', data: data }).end();
        })
        .catch(function (err) {
            console.log('[login.js] Failed Insertion!');
            //console.log(err);
            res.status(404).json({success: false, message: 'user name exist.'}).end();
        });
    });
});

router.get('/logout', function(req, res){
    delete req.session;
    res.redirect(config.site_root+'/login');
});

module.exports = router;
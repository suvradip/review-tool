var express,
	app,
	path,
	review;

express = require("express");
path = require("path");
review = require("./models/reviews");

app = express();

app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use('/bower_components', express.static('bower_components'));
app.set('view engine', 'ejs');

//if port number is changing, also change in gulpfile for browsersync proxy
app.listen(3000, function(){ console.log('[server.js] Running on port :3000'); });

app.get('/', function(req, res){
	res.render('index');
});


app.post('/api/review', function(req, res, next) {  
    var entry,
        promise;

        entry = new products({
            username: 'pid' + timeNow,
            review: req.body.productName,
            avatar: req.body.category
        });

        promise = entry.save();
        promise.then(function() {
            console.log('Inserted Successfully!');
            res.status(200).end();
        })
        .catch(function (err) {
            console.log('Failed Insertion!');
            console.log(err);
            res.status(404).end();
        });
});

app.get('/api/review', function (req, res) {
    var entries,
        i,
        id = req.query.id,
        keys = req.query.keys,
        keyNames = keys && keys.split(','),
        projection = {},
        query = {};

    if(id !== undefined)
    	query.productId = id;
    
    if (keys !== undefined) {
        for (i = 0; i < keyNames.length; i++) {
            projection[keyNames[i]] = 1;
        }
    }

    entries = products.find(query, projection);

    entries.then(function (result) {
        console.log('Retreived Successfully!');
        res.status(200).json(result).end();
    })
    .catch(function (err) {
        console.log('Retreive Failed!');
        console.log(err);
        res.status(404).end();
    });
});
// var MongoClient = require('./lib/mongodb').MongoClient;

// MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {

// 	var t = db.collection('t');
// 	var cursor = t.find()
// 	console.log(cursor.constructor.name)
// 	db.close();
// });

var mongodb = require('./lib/mongodb'),
    async = require('async'),
    ObjectId = mongodb.ObjectID,
    ReplicaSetManager = require('./test/tools/replica_set_manager').ReplicaSetManager,
    dbUrl = 'mongodb://127.0.0.1:30000/mydb?replicaSet=rs0',
    dbOptions = {
        db: {
            w: 1
        },
        server: {
            auto_reconnect: true,
            poolSize: 5
        }
    },
    callbacksCalled = {};

function runTest(db, col) {
    var i = 0;

    function next(cursor, id) {
        cursor.nextObject(function (err, doc) {
            if (err) {
                console.log('nextObject', id, 'error:', err);
            } else {
                if (doc) {
                    console.log('nextObject', id, 'found:', doc);
                } else {
                    console.log('nextObject', id, 'no document');
                }
            }

            if (callbacksCalled[id]) {
                console.log('callback', id, 'called twice');
                console.log('dumping the cursor nextObject was called on:');
                console.log(cursor);
                process.exit(1);
            }

            callbacksCalled[id] = true;

            if (cursor.isClosed()) {
                console.log('cursor closed');
                // restart
                i += 10;
                start();
            } else {
                i += 1;
                next(cursor, i);
            }
        });
    }

    function start() {
        var cursor = col.find({}, {tailable: true, numberOfRetries: -1}).
                sort({$natural: 1});
        next(cursor, i);
    }

    start();
}

RS = new ReplicaSetManager({name:"rs0", retries:120, secondary_count:0, passive_count:0, arbiter_count:1});
RS.startSet(true, function(err, result) {
  if(err != null) throw err;

	mongodb.Db.connect(dbUrl, dbOptions, function (err, db) {
	    if (err) {
	        console.log(err);
	        process.exit(1);
	    }

	    console.log('database connected');

	    db.on('error', function (err) {
	        console.log('db.on(\'error\'):', err);
	    });

	    db.createCollection('testCapped', {capped: true, w: 1, size: 100000, max: 20}, function (err, col) {
	        if (err) {
	            console.log(err);
	            process.exit(1);
	        }

	        console.log('collection created');

	        runTest(db, col);
	    });
	});
})
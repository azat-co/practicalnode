var mongo = require('../');
var Db = mongo.Db;
var Server = mongo.Server;
var ReplSetServers = mongo.ReplSetServers;

var replSet = new ReplSetServers([
  new Server('localhost', 30000),
  new Server('localhost', 30001),
  new Server('localhost', 30002)
]);
var db = new Db('integration_test_', replSet, {w:0});
db.collection('article').find().toArray(function(err, data) {
    console.log(err && err.stack);
    console.log(data);

});


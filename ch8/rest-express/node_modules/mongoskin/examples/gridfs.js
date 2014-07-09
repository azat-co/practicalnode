var db = require('./config').db;

var gs = db.gridStore('test.txt', 'w')
gs.write('blablabla', function(err, reply) {
    gs.close(function(err, reply){
        var gs = db.gridStore('test.txt', 'r')
        gs.read(function(err, reply){
            console.log(reply.toString());
        });
    });
});

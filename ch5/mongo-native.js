var mongo = require('mongodb'),
  dbHost = '127.0.0.1',
  dbPort = 27017;

var Db = mongo.Db;
var Connection = mongo.Connection;
var Server = mongo.Server;
var db = new Db ('local', new Server(dbHost, dbPort), {safe:true});

db.open(function(error, dbConnection){
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log('db state: ', db._state);
  dbConnection.collection('messages').findOne({}, function(error, item){
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.info('findOne: ', item);
    item.text = 'hi';
    var id = item._id.toString(); // we can store ID in a string
    console.info('before saving: ', item);
    dbConnection.collection('messages').save(item, function(error, item){
      console.info('save: ', item);
      dbConnection.collection('messages').find({_id: new mongo.ObjectID(id)}).toArray(function(error, items){
        console.info('find: ', items);
        db.close();
        process.exit(0);
      });
    });
  })
});

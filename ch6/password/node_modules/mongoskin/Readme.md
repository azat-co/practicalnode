# mongoskin

[![Build Status](https://secure.travis-ci.org/kissjs/node-mongoskin.png)](http://travis-ci.org/kissjs/node-mongoskin)
[![Dependencies](https://david-dm.org/kissjs/node-mongoskin.png)](https://david-dm.org/kissjs/node-mongoskin)
[![Coverage Status](https://coveralls.io/repos/kissjs/node-mongoskin/badge.png?branch=master)](https://coveralls.io/r/kissjs/node-mongoskin?branch=master)
[![NPM version](https://badge.fury.io/js/mongoskin.png)](http://badge.fury.io/js/mongoskin)

[![NPM](https://nodei.co/npm/mongoskin.png?downloads=true&stars=true)](https://nodei.co/npm/mongoskin/)

Install
========

```bash
$ npm install mongoskin
```

Usage
========

Use dburl

```js
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/integration_tests", {native_parser:true});
db.bind('article');
db.article.find().toArray(function(err, items) {
        db.close();
});
```

Use ReplSet

```js
var mongo = require('mongoskin');
var Server = mongo.Server;
var Db = mongo.Db;

var replSet = new ReplSetServers([
        new Server('localhost', 30000),
        new Server('localhost', 30001),
        new Server('localhost', 30002),
]);

var db = new Db('integration_test_', replSet, {w:0, native_parser: (process.env['TEST_NATIVE'] != null)});
// no need open and on('fullsetup', ...)
db.collection('myconnection').find().setReadPreference(ReadPreference.SECONDARY).toArray(function(err, items) {
        db.close();
});
```

Model helper:

```js
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/integration_tests", {native_parser:true});
db.bind('article').bind({
    getByAuthor: function(author_id, callback) {
        this.findOne({author_id: author_id}, callback);
    }
});
db.article.getByAuthor(author_id, function(err, article) {
        console.log(article);
});
```

## Origin API part
For detail API reference see [node mongodb API](http://mongodb.github.io/node-mongodb-native/). Mongoskin is just change the API call chain.

We make some common use functions in promise mode, we call it SkinClass of a normal Class. And the API is almost same with official API.

### module

origin:
```js
var mongo = require('mongodb');
var Db = mongo.Db;
var Server = mongo.Server;
var MongoClient = mongo.MongoClient;
var ReplSetServers = mongo.ReplSetServers;
...
```

mongoskin:

```js
var mongo = require('mongoskin');
var Db = mongo.Db;
var Server = mongo.Server;
var MongoClient = mongo.MongoClient;
var ReplSetServers = mongo.ReplSetServers;
...
```

### MongoClient.connect(...)

returns a `Db` instance

alias origin `MongoClient.connect(..., function(err, db) { .... })`

origin:

```js
MongoClient.connect(..., function(err, db) {
})
```

mongoskin:

```js
var db = MongoClient.connect(...)
```

### db.collection(..., [callback])

returns a `Collection` instance

alias origin `db.collection(..., function(err, collection) {....})`

origin:

```js
var db = new Db(...);
db.open(function(err, db) {
    db.collection('myCollection', {strict: true}, function(err, myCollection) {
        // myCollection.find() ...
    });
});
```

mongoskin:

```js
var db = new Db(...);
var myCollection = db.collection('myCollection', {strict: true});
```

## MongoSkin API part

### module.db(...)
alias `MongoClient.connect(...)`
### module.helper.toObjectID(hexStr)
convert `String` to `ObjectID` instance.
### db.bind(name, options)
alias `db[name] = db.collection(name, options)`

```js
db.bind('article')
db.article.find().toArray(function(err, items) {
  assert.ok(err == null);
});
```

### db.admin(...)
alias `new Admin(db, ...)`
### db.grid(...)
alias `new Grid(db, ...)`
### db.gridStore(...)
alias `new GridStore(db, ...)`
### collection.bind(extendObject)
each method of extendObject will be bind to collection.
### collection.findById(id, ...)
alias `collection.find({_id: toObjectID(id)}, ...)`
### collection.updateById(id, ...)
alias `collection.update({_id: toObjectID(id)}, ...)`
### collection.removeById(id, ...)
alias `collection.remove({_id: toObjectID(id)}, ...)`

## NOTE!! mongoskin API change from 1.3.20

Since node-mongodb-native has change a lot of API, mongoskin redesign from 1.3.20. The version number keep same with node-mongodb-native. And the API appearence is also keep same with node-mongodb-native

### Removed API from mongoskin 1.3.20

* module.bind
* module.Skin*
* module.router
* skinDb.toId
* skinDb.toObjectId
* skinDb.gridfs
* skinCollection.bind

### Modified API from mongoskin 1.3.20

* module.db
* skinDb.bind


### Additional API from mongoskin 1.3.20

* module.MongoClient
* module.Grid
* module.GridStore
* module.helper.toObjectID

## Authors

Below is the output from `git-summary`.

```
 project  : node-mongoskin
 repo age : 2 years, 10 months
 active   : 84 days
 commits  : 180
 files    : 44
 authors  :
    49	Lin Gui                 27.2%
    44	fengmk2                 24.4%
    34	guilin 桂林           18.9%
    23	Gui Lin                 12.8%
     5	guilin                  2.8%
     2	Raghu Katti             1.1%
     2	Merlyn Albery-Speyer    1.1%
     2	Paul Gebheim            1.1%
     2	Joakim B                1.1%
     2	François de Metz       1.1%
     1	Wout Mertens            0.6%
     1	Yuriy Nemtsov           0.6%
     1	fresheneesz             0.6%
     1	humanchimp              0.6%
     1	Alan Shaw               0.6%
     1	wmertens                0.6%
     1	Aneil Mallavarapu       0.6%
     1	Gustav                  0.6%
     1	Harvey McQueen          0.6%
     1	Joe Faber               0.6%
     1	Matt Perpick            0.6%
     1	Philmod                 0.6%
     1	Quang Van               0.6%
     1	Rakshit Menpara         0.6%
     1	Shawn Jonnet            0.6%
```

## License 

(The MIT License)

Copyright (c) 2011 - 2012 kissjs.org

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

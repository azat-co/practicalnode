
0.6.1 / 2013-11-24 
==================

  * Merge pull request #122 from Philmod/older-mongodb
  * older version of mongodb
  * Merge pull request #108 from fresheneesz/patch-1
  * Merge pull request #114 from nemtsov/patch-1
  * fix typo: this.hit -> this.hint
  * Vastly improving the documentation around the mongoskin.db method

0.6.0 / 2013-07-16 
==================

  * changed version in package.json to 1.3.x for mongodb
  * Upgraded the mongo db version to 1.3.x. Mixing mongodb 1.2.x which mongoskin 0.5.0 depends on and latest mongodb 1.3.x causes Mongodb connection timeout problems in replication environment.
  * Use HTTPS so GitHub doesn't cache dependency badge
  * add Dependencies status image
  * Corrected repository URL in package.json
  * Documentation improvements
  * add 0.9 version test

0.5.0 / 2012-12-29 
==================

  * fixed unsafe mode warnning log
  * Merge pull request #84 from kingpearl/master
  * MongoDB 1.2.x support
  * Merge pull request #73 from jockster/master
  * Merge pull request #75 from voke/patch-1
  * Fix typo
  * fixed bind() test cases;
  * Minor error in readme. Now updated
  * Updated readme according to issue #72

0.3.4 / 2011-03-24
 * fix global leaks

0.3.3 / 2011-03-15
==================
 * Add rootCollection option to SkinGridStore.exist

0.3.2 / 2011-03-01
==================
 * exports all classes of node-mongodb-native

0.3.1 / 2011-02-26
==================
 * bug fix #33

0.3.0 / 2011-01-19
==================
 * add ReplSet support
 * bug fix

0.2.3 / 2011-01-03
==================
 * add db.toObjectID
 * fix #25 for node-mongodb-native update

0.2.2 / 2011-12-02
==================
 * add bind support for embeded collections, e.g. db.bind('system.js')
 * add method `toId` to SkinDB
 * add property `ObjectID`, `bson_serializer` to SkinDB.
 * SkinCollection.prototype.id is now deprecated.

0.2.1 / 2011-11-18
==================
 * add ObjectId support for XXXXById

0.2.0 / 2011-11-06
==================
  * add SkinDB.gridfs

0.1.3 / 2011-05-24
==================
  * add SkinCollection.removeById

0.1.2 / 2011-04-30 
==================
  * add mongoskin.router

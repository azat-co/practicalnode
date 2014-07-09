
0.7.0 / 2014-05-02
==================

 * fixed; pass $maxDistance in $near object as described in docs #43 [vkarpov15](https://github.com/vkarpov15)
 * fixed; cloning buffers #42 [gjohnson](https://github.com/gjohnson)
 * tests; a little bit more `mongodb` agnostic #34 [refack](https://github.com/refack)

0.6.0 / 2014-04-01
==================

 * fixed; Allow $meta args in sort() so text search sorting works #37 [vkarpov15](https://github.com/vkarpov15)

0.5.3 / 2014-02-22
==================

 * fixed; cloning mongodb.Binary

0.5.2 / 2014-01-30
==================

 * fixed; cloning ObjectId constructors
 * fixed; cloning of ReadPreferences #30 [ashtuchkin](https://github.com/ashtuchkin)
 * tests; use specific mongodb version #29 [AvianFlu](https://github.com/AvianFlu)
 * tests; remove dependency on ObjectId #28 [refack](https://github.com/refack)
 * tests; add failing ReadPref test

0.5.1 / 2014-01-17
==================

 * added; deprecation notice to tags parameter #27 [ashtuchkin](https://github.com/ashtuchkin)
 * readme; add links

0.5.0 / 2014-01-16
==================

 * removed; mongodb driver dependency #26 [ashtuchkin](https://github.com/ashtuchkin)
 * removed; first class support of read preference tags #26 (still supported though) [ashtuchkin](https://github.com/ashtuchkin)
 * added; better ObjectId clone support
 * fixed; cloning objects that have no constructor #21
 * docs; cleaned up [ashtuchkin](https://github.com/ashtuchkin)

0.4.2 / 2014-01-08
==================

 * updated; debug module 0.7.4 [refack](https://github.com/refack)

0.4.1 / 2014-01-07
==================

 * fixed; inclusive/exclusive logic

0.4.0 / 2014-01-06
==================

 * added; selected()
 * added; selectedInclusively()
 * added; selectedExclusively()

0.3.3 / 2013-11-14
==================

 * Fix Mongo DB Dependency #20 [rschmukler](https://github.com/rschmukler)

0.3.2 / 2013-09-06
==================

  * added; geometry support for near()

0.3.1 / 2013-08-22
==================

  * fixed; update retains key order #19

0.3.0 / 2013-08-22
==================

  * less hardcoded isNode env detection #18 [vshulyak](https://github.com/vshulyak)
  * added; validation of findAndModify varients
  * clone update doc before execution
  * stricter env checks

0.2.7 / 2013-08-2
==================

  * Now support GeoJSON point values for Query#near

0.2.6 / 2013-07-30
==================

  * internally, 'asc' and 'desc' for sorts are now converted into 1 and -1, respectively 

0.2.5 / 2013-07-30
==================

  * updated docs
  * changed internal representation of `sort` to use objects instead of arrays

0.2.4 / 2013-07-25
==================

  * updated; sliced to 0.0.5

0.2.3 / 2013-07-09
==================

  * now using a callback in collection.find instead of directly calling toArray() on the cursor [ebensing](https://github.com/ebensing)

0.2.2 / 2013-07-09
==================

  * now exposing mongodb export to allow for better testing [ebensing](https://github.com/ebensing)

0.2.1 / 2013-07-08
==================

  * select no longer accepts arrays as parameters [ebensing](https://github.com/ebensing)

0.2.0 / 2013-07-05
==================

  * use $geoWithin by default

0.1.2 / 2013-07-02
==================

  * added use$geoWithin flag [ebensing](https://github.com/ebensing)
  * fix read preferences typo [ebensing](https://github.com/ebensing)
  * fix reference to old param name in exists() [ebensing](https://github.com/ebensing)

0.1.1 / 2013-06-24
==================

  * fixed; $intersects -> $geoIntersects #14 [ebensing](https://github.com/ebensing)
  * fixed; Retain key order when copying objects #15 [ebensing](https://github.com/ebensing)
  * bump mongodb dev dep

0.1.0 / 2013-05-06
==================

  * findAndModify; return the query
  * move mquery.proto.canMerge to mquery.canMerge
  * overwrite option now works with non-empty objects
  * use strict mode
  * validate count options
  * validate distinct options
  * add aggregate to base collection methods
  * clone merge arguments
  * clone merged update arguments
  * move subclass to mquery.prototype.toConstructor
  * fixed; maxScan casing
  * use regexp-clone
  * added; geometry/intersects support
  * support $and
  * near: do not use "radius"
  * callbacks always fire on next turn of loop
  * defined collection interface
  * remove time from tests
  * clarify goals
  * updated docs;

0.0.1 / 2012-12-15
==================

  * initial release

var tls = require('tls');

module.exports = {
  clone: clone
, extractHostname: extractHostname
, merge: merge
};

function clone (obj) {
  if (obj === undefined || obj === null)
    return obj
  if (Array.isArray(obj))
    return cloneArray(obj);
  if (obj.constructor == Object)
    return cloneObject(obj);
  return obj;
}

function cloneObject (obj, shouldMinimizeData) {
  var ret = {};
  for (var k in obj)
    ret[k] = clone(obj[k]);
  return ret;
}

function cloneArray (arr) {
  var ret = [];
  for (var i = 0, l = arr.length; i < l; i++)
    ret.push(clone(arr[i]));
  return ret;
}

function extractHostname (req) {
  var headers = req.headers
    , protocol = (req.connection.server instanceof tls.Server ||
                 (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'].slice(0,5) === 'https'))
               ? 'https://'
               : 'http://'
    , host = headers.host;
  return protocol + host;
}

function merge () {
  var mergeInto = {};
  for (var i = 0, l = arguments.length, mergeFrom, k; i < l; i++) {
    mergeFrom = arguments[i];
    for (k in mergeFrom) {
      mergeInto[k] = mergeFrom[k];
    }
  }
  return mergeInto;
}

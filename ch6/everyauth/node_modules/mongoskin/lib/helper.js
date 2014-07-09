var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

/**
 * Convert to ObjectID.
 * 
 * @param {String} hex
 * @return {ObjectID}
 */
exports.toObjectID = function (hex) {
  if (hex instanceof ObjectID) {
    return hex;
  }
  if (!hex || hex.length !== 24) {
    return hex;
  }
  return ObjectID.createFromHexString(hex);
};

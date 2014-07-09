
/**
 * Module dependencies.
 */

var crc32 = require('buffer-crc32').unsigned;

/**
 * Return a weak ETag from the given `path` and `stat`.
 *
 * @param {String} path
 * @param {Object} stat
 * @return {String}
 * @api private
 */

exports.etag = function etag(path, stat) {
  var tag = String(stat.mtime.getTime()) + ':' + String(stat.size) + ':' + path;
  return 'W/"' + crc32(tag) + '"';
};

/**
 * decodeURIComponent.
 *
 * Allows V8 to only deoptimize this fn instead of all
 * of send().
 *
 * @param {String} path
 * @api private
 */

exports.decode = function(path){
  try {
    return decodeURIComponent(path);
  } catch (err) {
    return -1;
  }
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function(html){
  return String(html)
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
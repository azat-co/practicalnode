var expect = require('expect.js');

/**
 * Adapted from Tobi to work with expect.js
 *
 * Tobi - assertions - should
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */
var Assertion = expect.Assertion
  , statusCodes = require('http').STATUS_CODES
  , j = function(elem){ return '[jQuery ' + i(elem.selector.replace(/^ *\* */, '')) + ']'; }
  , i = require('sys').inspect;

/**
 * Number strings.
 */

var nums = [
    'none'
  , 'one'
  , 'two'
  , 'three'
  , 'four'
  , 'five'
];

/**
 * Return string representation for `n`.
 *
 * @param {Number} n
 * @return {String}
 * @api private
 */

function n(n) { return nums[n] || n; }

/**
 * Assert text as `str` or a `RegExp`.
 *
 * @param {String|RegExp} str
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.text = function(str){
  var elem = this.obj
    , text = elem.text()
    , include = this.includes;

  if (str instanceof RegExp) {
    this.assert(
        str.test(text)
      , 'expected ' + j(elem)+ ' to have text matching ' + i(str)
      , 'expected ' + j(elem) + ' text ' + i(text) + ' to not match ' + i(str));
  } else if (include) {
    this.assert(
        ~text.indexOf(str)
      , 'expected ' + j(elem) + ' to include text ' + i(str) + ' within ' + i(text)
      , 'expected ' + j(elem) + ' to not include text ' + i(str) + ' within ' + i(text));
  } else {
    this.assert(
        str == text
      , 'expected ' + j(elem) + ' to have text ' + i(str) + ', but has ' + i(text)
      , 'expected ' + j(elem) + ' to not have text ' + i(str));
  }

  return this;
};

/**
 * Assert that many child elements are present via `selector`.
 * When negated, <= 1 is a valid length.
 *
 * @param {String} selector
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.many = function(selector){
  var elem = this.obj
    , elems = elem.find(selector)
    , len = elems.length;

  this.assert(
      this.negate ? len > 1 : len
    , 'expected ' + j(elem) + ' to have many ' + i(selector) + ' tags, but has ' + n(len)
    , 'expected ' + j(elem) + ' to not have many ' + i(selector) + ' tags, but has ' + n(len));

  return this;
};

/**
 * Assert that one child element is present via `selector`
 * with optional `text` assertion..
 *
 * @param {String} selector
 * @param {String} text
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.one = function(selector, text){
  var elem = this.obj
    , elems = elem.find(selector)
    , len = elems.length;

  this.assert(
      1 == len
    , 'expected ' + j(elem) + ' to have one ' + i(selector) + ' tag, but has ' + n(len)
    , 'expected ' + j(elem) + ' to not have one ' + i(selector) + ' tag, but has ' + n(len));

  if (undefined != text) {
    expect(elems).to.have.text(text);
  }

  return this;
};

/**
 * Assert existance attr `key` with optional `val`.
 *
 * @param {String} key
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.attr = function(key, val){
  var elem = this.obj
    , attr = elem.attr(key);

  if (!val || (val && !this.negate)) {
    this.assert(
        attr.length
      , 'expected ' + j(elem) + ' to have attribute ' + i(key)
      , 'expected ' + j(elem) + ' to not have attribute ' + i(key) + ', but has ' + i(attr));
  }

  if (val) {
    this.assert(
        val == attr
      , 'expected ' + j(elem) + ' to have attribute ' + i(key) + ' with ' + i(val) + ', but has ' + i(attr)
      , 'expected ' + j(elem) + ' to not have attribute ' + i(key) + ' with ' + i(val));
  }

  return this;
};

/**
 * Assert presence of the given class `name`.
 *
 * @param {String} name
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.class = function(name){
  var elem = this.obj;

  this.assert(
      elem.hasClass(name)
    , 'expected ' + j(elem) + ' to have class ' + i(name) + ', but has ' + i(elem.attr('class'))
    , 'expected ' + j(elem) + ' to not have class ' + i(name));

  return this;
};

/**
 * Assert that header `field` has the given `val`. 
 *
 * @param {String} field
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.header = function(field, val){
  expect(this.obj).to.have.property('headers');
  expect(this.obj.headers).to.have.property(field.toLowerCase(), val);
  return this;
};

/**
 * Assert `.statusCode` of `code`.
 *
 * @param {Number} code
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.status = function(code){
  expect(this.obj).to.have.property('statusCode');
  var status = this.obj.statusCode;

  this.assert(
      code == status
    , 'expected response code of ' + code + ' ' + i(statusCodes[code])
      + ', but got ' + status + ' ' + i(statusCodes[status])
    , 'expected to not respond with ' + code + ' ' + i(statusCodes[code]));

  return this;
};

/**
 * Assert id attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.id = attr('id');

/**
 * Assert title attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.title = attr('title');

/**
 * Assert alt attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.alt = attr('alt');

/**
 * Assert href attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.href = attr('href');

/**
 * Assert src attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.src = attr('src');

/**
 * Assert rel attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.rel = attr('rel');

/**
 * Assert media attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.media = attr('media');

/**
 * Assert name attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.name = attr('name');

/**
 * Assert action attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.action = attr('action');

/**
 * Assert method attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.method = attr('method');

/**
 * Assert value attribute.
 *
 * @param {String} val
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.value = attr('value');

/**
 * Assert enabled.
 *
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.enabled = function () {
  var elem = this.obj
    , disabled = elem.attr('disabled');

  this.assert(
      !disabled
    , 'expected ' + j(elem) + ' to be enabled'
    , '<not implemented, use .disabled>');

  return this;
};

/**
 * Assert disabled.
 *
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.disabled = function () {
  var elem = this.obj
    , disabled = elem.attr('disabled');

  this.assert(
      disabled
    , 'expected ' + j(elem) + ' to be disabled'
    , '<not implemented, use .enabled>');

  return this;
};

/**
 * Assert checked.
 *
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.checked = bool('checked');

/**
 * Assert selected.
 *
 * @return {Assertion} for chaining
 * @api public
 */

Assertion.prototype.selected = bool('selected');

/**
 * Generate a boolean assertion function for the given attr `name`.
 *
 * @param {String} name
 * @return {Function}
 * @api private
 */

function bool(name) {
  return function(){
    var elem = this.obj;

    this.assert(
        elem.attr(name)
      , 'expected ' + j(elem) + ' to be ' + name
      , 'expected ' + j(elem) + ' to not be ' + name);

    return this;
  }
}

/**
 * Generate an attr assertion function for the given attr `name`.
 *
 * @param {String} name
 * @return {Function}
 * @api private
 */

function attr(name) {
  return function(expected){
    var elem = this.obj
      , val = elem.attr(name);

    this.assert(
        expected == val
      , 'expected ' + j(elem) + ' to have ' + name + ' ' + i(expected) + ', but has ' + i(val)
      , 'expected ' + j(elem) + ' to not have ' + name + ' ' + i(expected));

    return this;
  }
}

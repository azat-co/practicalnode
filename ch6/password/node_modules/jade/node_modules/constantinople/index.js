'use strict'

var uglify = require('uglify-js')

var lastSRC = '(null)'
var lastRes = true
var lastConstants = undefined;

module.exports = isConstant
function isConstant(src, constants) {
  src = '(' + src + ')'
  if (lastSRC === src && lastConstants === constants) return lastRes
  lastSRC = src
  try {
    return lastRes = (detect(src).filter(function (key) {
      return !constants || !(key in constants)
    }).length === 0)
  } catch (ex) {
    return lastRes = false
  }
}
isConstant.isConstant = isConstant

isConstant.toConstant = toConstant
function toConstant(src, constants) {
  if (!isConstant(src, constants)) throw new Error(JSON.stringify(src) + ' is not constant.')
  return Function(Object.keys(constants || {}).join(','), 'return (' + src + ')').apply(null, Object.keys(constants || {}).map(function (key) {
    return constants[key];
  }));
}

function detect(src) {
  var ast = uglify.parse(src.toString())
  ast.figure_out_scope()
  var globals = ast.globals
    .map(function (node, name) {
      return name
    })
  return globals
}
'use strict';

var uglify = require('uglify-js')

module.exports = addWith

/**
 * Mimic `with` as far as possible but at compile time
 *
 * @param {String} obj The object part of a with expression
 * @param {String} src The body of the with expression
 * @param {Array.<String>} exclude A list of variable names to explicitly exclude
 */
function addWith(obj, src, exclude) {
  obj = obj + ''
  src = src + ''
  exclude = exclude || []
  exclude = exclude.concat(detect(obj))
  var vars = detect(src)
    .filter(function (v) {
      return exclude.indexOf(v) === -1
    })

  if (vars.length === 0) return src

  var declareLocal = ''
  var local = 'locals_for_with'
  var result = 'result_of_with'
  if (/^[a-zA-Z0-9$_]+$/.test(obj)) {
    local = obj
  } else {
    while (vars.indexOf(local) != -1 || exclude.indexOf(local) != -1) {
      local += '_'
    }
    declareLocal = 'var ' + local + ' = (' + obj + ')'
  }
  while (vars.indexOf(result) != -1 || exclude.indexOf(result) != -1) {
    result += '_'
  }

  var inputVars = vars.map(function (v) {
    return JSON.stringify(v) + ' in ' + local + '?' +
      local + '.' + v + ':' +
      'typeof ' + v + '!=="undefined"?' + v + ':undefined'
  })

  src = '(function (' + vars.join(', ') + ') {' +
    src +
    '}(' + inputVars.join(',') + '))'

  return ';' + declareLocal + ';' + unwrapReturns(src, result) + ';'
}

/**
 * Detect, and return a list of, any global variables in a function
 *
 * @param {String} src Some JavaScript code
 */
function detect(src) {
    var ast = uglify.parse('(function () {' + src + '}())') // allow return keyword
    ast.figure_out_scope()
    var globals = ast.globals
        .map(function (node, name) {
            return name
        })
    return globals
}

/**
 * Take a self calling function, and unwrap it such that return inside the function
 * results in return outside the function
 *
 * @param {String} src    Some JavaScript code representing a self-calling function
 * @param {String} result A temporary variable to store the result in
 */
function unwrapReturns(src, result) {
  var originalSource = src
  var hasReturn = false
  var ast = uglify.parse(src)
  src = src.split('')

  if (ast.body.length !== 1 || ast.body[0].TYPE !== 'SimpleStatement' ||
      ast.body[0].body.TYPE !== 'Call' || ast.body[0].body.expression.TYPE !== 'Function')
    throw new Error('AST does not seem to represent a self-calling function')
  var fn = ast.body[0].body.expression

  var walker = new uglify.TreeWalker(visitor)
  function visitor(node, descend) {
    if (node !== fn && (node.TYPE === 'Defun' || node.TYPE === 'Function')) {
      return true //don't descend into functions
    }
    if (node.TYPE === 'Return') {
      descend()
      hasReturn = true
      replace(node, 'return {value: ' + source(node.value) + '};')
      return true //don't descend again
    }
  }
  function source(node) {
    return src.slice(node.start.pos, node.end.endpos).join('')
  }
  function replace(node, str) {
    for (var i = node.start.pos; i < node.end.endpos; i++) {
      src[i] = ''
    }
    src[node.start.pos] = str
  }
  ast.walk(walker)
  if (!hasReturn) return originalSource
  else return 'var ' + result + '=' + src.join('') + ';if (' + result + ') return ' + result + '.value'
}

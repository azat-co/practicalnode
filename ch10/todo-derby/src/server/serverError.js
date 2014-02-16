var derby, path;

path = require('path');

derby = require('derby');

module.exports = function() {
  var staticPages;
  staticPages = derby.createStatic(path.dirname(path.dirname(__dirname)));
  return function(err, req, res, next) {
    var message, status;
    if (err == null) {
      return next();
    }
    console.log(err.stack ? err.stack : err);
    message = err.message || err.toString();
    status = parseInt(message);
    status = (400 <= status && status < 600) ? status : 500;
    if (status === 403 || status === 404 || status === 500) {
      return staticPages.render('error', res, status.toString(), status);
    } else {
      return res.send(status);
    }
  };
};
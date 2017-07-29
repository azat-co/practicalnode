var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var errorHandler = require('errorhandler');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

var domain = require('domain');
var defaultHandler = errorHandler();
app.get('/', routes.index);

app.get('/e', function (req, res, next) {
  var d = domain.create();
  d.on('error', function (error) {
    console.error(error.stack);
    res.send(500, {'error': error.message});
  });
  d.run(function () {
    //error prone code goes here
    throw new Error('Database is down.');
    // next(new Error('Database is down.'));
  });
});

app.use(function (error, req, res, next) {
  if (domain.active) {
    console.info('caught with domain', domain.active);
    domain.active.emit('error', error);
  } else {
    console.info('no domain');
    defaultHandler(error, req, res, next);
  }
});

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

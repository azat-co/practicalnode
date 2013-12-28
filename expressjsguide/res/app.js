
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/render', function(req, res) {
  res.render('render');
});

app.get('/render-title', function(req, res) {
  res.render('index', {title: 'Express.js Guide'});
});

app.get('/locals', function(req, res){
  res.locals = { title: 'Express.js Guide' };
  res.render('index');
});

app.get('/set-html', function(req, res) {
  //some code
  res.set('Content-type', 'text/html');
  res.end('<html><body>' +
    '<h1>Express.js Guide</h1>' +
    '</body></html>');
});

app.get('/set-csv', function(req, res) {
  var body = 'title, tags\n' +
    'Express.js Guide, node.js express.js\n' +
    'Rapid Prototyping with JS, backbone.js, node.js, mongodb\n' +
    'JavaScript: The Good Parts, javascript\n';
  res.set({'Content-Type': 'text/plain',
    'Content-Length': body.length,
    'Set-Cookie': ['type=reader', 'language=javascript']});
  res.end(body);
});

app.get('/status', function(req, res) {
  res.status(200).send('alive');
});

app.get('/send-ok', function(req, res) {
  res.send(200, {message: 'Data was submitted successfully.'});
});

app.get('/send-err', function(req, res) {
  res.send(500, {message: 'Oops, the server is down.'});
});

app.get('/send-buf', function(req, res) {
  res.set('Content-Type', 'text/plain');
  res.send(new Buffer('CSV data in text format'));
});

app.get('/json', function(req, res) {
  res.json(200, [{title: 'Express.js Guide', tags: 'node.js express.js'},
    {title: 'Rapid Prototyping with JS', tags: 'backbone.js, node.js, mongodb'},
    {title: 'JavaScript: The Good Parts', tags: 'javascript'}
  ]);
});

app.get('/jsonp', function (req, res) {
  res.jsonp(200, [{title: 'Express.js Guide', tags: 'node.js express.js'},
    {title: 'Rapid Prototyping with JS', tags: 'backbone.js, node.js, mongodb'},
    {title: 'JavaScript: The Good Parts', tags: 'javascript'}
  ]);
});
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

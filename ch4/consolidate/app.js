var express = require('express'),
  cons = require('consolidate'),
  app = express()

// assign the swig engine to .html files
app.engine('html', cons.swig)

// set .html as the default extension
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

var platforms = [
  { name: 'node' },
  { name: 'ruby' },
  { name: 'python' }
]

app.get('/', function(req, res){
  res.render('index', {
    title: 'Consolidate This'
  });
});

app.get('/platforms', function(req, res){
  res.render('platforms', {
    title: 'Platforms',
    platforms: platforms
  });
});

app.listen(3000);
console.log('Express server listening on port 3000');
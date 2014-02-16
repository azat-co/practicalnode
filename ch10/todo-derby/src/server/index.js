var app,
  derby,
  express,
  expressApp,
  liveDbMongo,
  mongoUrl,
  publicDir,
  racerBrowserChannel,
  redis,
  redisUrl,
  serverError,
  store,
  path;
path = require('path');
express = require('express');
derby = require('derby');
racerBrowserChannel = require('racer-browserchannel');
liveDbMongo = require('livedb-mongo');
serverError = require('./serverError');

app = require('../todos');

expressApp = module.exports = express();

if (process.env.REDIS_HOST) {
  redis = require('redis').createClient(process.env.REDIS_PORT,
    process.env.REDIS_HOST);
  redis.auth(process.env.REDIS_PASSWORD);
} else if (process.env.OPENREDIS_URL) {
  redisUrl = require('url').parse(process.env.OPENREDIS_URL);
  redis = require('redis').createClient(redisUrl.port, redisUrl.hostname);
  redis.auth(redisUrl.auth.split(":")[1]);
} else {
  redis = require('redis').createClient();
}

redis.select(5);

mongoUrl = process.env.MONGO_URL || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/derby-todos';

store = derby.createStore({
  db: liveDbMongo(mongoUrl + '?auto_reconnect', {
    safe: true
  }),
  redis: redis
});

publicDir = path.join(__dirname + '/../../public');

// store.on('bundle', function(browserify) {
//   browserify.add(publicDir + '/jquery-1.9.1.min.js');
//   browserify.add(publicDir + '/jquery-ui-1.10.3.custom.min.js');
//   return browserify.transform(coffeeify);
// });

expressApp
  .use(express.favicon())
  .use(express.compress())
  .use(app.scripts(store))
  .use(racerBrowserChannel(store))
  .use(store.modelMiddleware())
  .use(app.router())
  .use(express.static(path.join(publicDir), '/js'))
  .use(expressApp.router)
  .use(serverError());

expressApp.all('*', function(req, res, next) {
  return next('404: ' + req.url);
});
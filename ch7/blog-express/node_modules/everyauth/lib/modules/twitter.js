var oauthModule = require('./oauth')
  , url = require('url');

var twitter = module.exports =
oauthModule.submodule('twitter')
  .apiHost('https://api.twitter.com')
  .oauthHost('https://api.twitter.com')
  .entryPath('/auth/twitter')
  .callbackPath('/auth/twitter/callback')
  .authorizePath('/oauth/authenticate')
  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var promise = this.Promise();
    this.oauth.get(this.apiHost() + '/1.1/users/show.json?user_id=' + params.user_id, accessToken, accessTokenSecret, function (err, data, res) {
      if (err) {
        err.extra = {data: data, res: res};
        return promise.fail(err);
      }
      var oauthUser = JSON.parse(data);
      promise.fulfill(oauthUser);
    });
    return promise;
  })
  .authCallbackDidErr( function (req) {
    var parsedUrl = url.parse(req.url, true);
    return parsedUrl.query && !!parsedUrl.query.denied;
  })
  .handleAuthCallbackError( function (req, res) {
    if (res.render) {
      res.render(__dirname + '/../views/auth-fail.jade', {
        errorDescription: 'The user denied your request'
      });
    } else {
      // TODO Replace this with a nice fallback
      throw new Error("You must configure handleAuthCallbackError if you are not using express");
    }
  })
  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var twitterResponse = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          twitterResponse.statusCode
        , twitterResponse.headers);
      serverResponse.end(err.extra.data);
    } else if (err.statusCode) {
      var serverResponse = seqValues.res;
      serverResponse.writeHead(err.statusCode);
      serverResponse.end(err.data);
    } else {
      console.error(err);
      throw new Error('Unsupported error type');
    }
  });

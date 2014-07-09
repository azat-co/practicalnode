var oauthModule = require('./oauth'),
    url = require('url');

var dropbox = module.exports =
oauthModule.submodule('dropbox')
  .apiHost('https://api.dropbox.com/1')
  .oauthHost('https://www.dropbox.com/1')
  .entryPath('/auth/dropbox')
  .callbackPath('/auth/dropbox/callback')

  .authCallbackDidErr( function (req) {
    var parsedUrl = url.parse(req.url, true);
    return parsedUrl.query && !!parsedUrl.query.not_approved;
  })

  .handleAuthCallbackError( function (req, res) {
    var parsedUrl = url.parse(req.url, true),
        errorDesc = parsedUrl.query.error + "; " + parsedUrl.query.error_description;
    if (res.render) {
      res.render(__dirname + '/../views/auth-fail.jade', {
        errorDescription: errorDesc
      });
    } else {
      // TODO Replace this with a nice fallback
      throw new Error("You must configure handleAuthCallbackError if you are not using express");
    }
  })

  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/account/info', accessToken, accessTokenSecret, function (err, data) {
      if (err) return p.fail(err);
      var oauthUser = JSON.parse(data);
      oauthUser.id = oauthUser.uid;
      p.fulfill(oauthUser);
    });
    return p;
  })

  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var dropboxResponse = err.extra.res,
          serverResponse = seqValues.res;
      serverResponse.writeHead(
          dropboxResponse.statusCode,
          dropboxResponse.headers);
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
var oauthModule = require('./oauth')
  , url = require('url')
  , Parser = require('xml2js').Parser
  , parser = new Parser({ mergeAttrs: true });

var osm = module.exports =
oauthModule.submodule('osm')
  .apiHost('http://api.openstreetmap.org')
  .oauthHost('http://www.openstreetmap.org')
  .entryPath('/auth/osm')
  .callbackPath('/auth/osm/callback')
  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var promise = this.Promise();
    this.oauth.get(this.apiHost() + '/api/0.6/user/details', accessToken, accessTokenSecret, function (err, data) {
      if (err) return promise.fail(err);
      parser.parseString(data, function (err, result) {
        if (err) return promise.fail(err);
        var oauthUser = result.user;
        promise.fulfill(oauthUser);
      });
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
  .convertErr( function (data) {
    return new Error(data.data.match(/<error>(.+)<\/error>/)[1]);
  });

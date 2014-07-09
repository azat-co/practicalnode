var oauthModule = require('./oauth')
  , url = require('url');

var tripitModule = module.exports =
oauthModule.submodule('tripit')
  .apiHost('https://api.tripit.com')
  .oauthHost('https://api.tripit.com')
  .entryPath('/auth/tripit')
  .callbackPath('/auth/tripit/callback')
  .redirectToProviderAuth( function (res, token) {
    var redirectTo = 'https://www.tripit.com' + this.authorizePath() + '?oauth_token=' + token;
    if (this.sendCallbackWithAuthorize()) {
      redirectTo += '&oauth_callback=' + this.myHostname() + this.callbackPath();
    }
    this.redirect(res, redirectTo);
  })
  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var promise = this.Promise();
    this.oauth.get(this.apiHost() + '/v1/get/profile/id/' + params.user_id + '/format/json',
        accessToken, accessTokenSecret, function (err, data) {
      if (err) {
        return promise.fail(err);
      }
      var oauthUser = JSON.parse(data).Profile;
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
  .convertErr( function (data) {
    return new Error(data.data.match(/<error>(.+)<\/error>/)[1]);
  });

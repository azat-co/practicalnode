var oauthModule = require('./oauth2')
  , url = require('url');

var mixi = module.exports =
oauthModule.submodule('mixi')
  .configurable({
      scope: 'specify types of access: See http://developers.mixi.co.jp/'
    , display: 'specify types of access: See http://developers.mixi.co.jp/'
  })

  .apiHost('https://api.mixi-platform.com/2')
  .oauthHost('https://secure.mixi-platform.com/2/token')

  .accessTokenPath('https://secure.mixi-platform.com/2/token')

  .authPath('https://mixi.jp/connect_authorize.pl')

  .entryPath('/auth/mixi')
  .callbackPath('/auth/mixi/callback')

  .authQueryParam('scope', function () {
    return this._scope && this.scope();
  })
  .authQueryParam('response_type', function () {
    return 'code';
  })
  .authQueryParam('display', function () {
    return this._display && this.display();
  })

  .accessTokenParam('grant_type', function () {
    return 'authorization_code';
  })

  .authCallbackDidErr( function (req) {
    var parsedUrl = url.parse(req.url, true);
    return parsedUrl.query && !!parsedUrl.query.error;
  })
  .handleAuthCallbackError( function (req, res) {
    var parsedUrl = url.parse(req.url, true)
      , errorDesc = parsedUrl.query.error_description;
    if (res.render) {
      res.render(__dirname + '/../views/auth-fail.jade', {
        errorDescription: errorDesc
      });
    } else {
      // TODO Replace this with a nice fallback
      throw new Error("You must configure handleAuthCallbackError if you are not using express");
    }
  })

  .fetchOAuthUser( function (accessToken) {
    var p = this.Promise();
    this.oauth.setAccessTokenName('oauth_token');
    this.oauth.get(this.apiHost() + '/people/@me/@self', accessToken, function (err, data) {
      if (err){
        return p.fail(err);
      }
      var oauthUser = JSON.parse(data);
      p.fulfill(oauthUser);
    })
    return p;
  })
  .convertErr( function (data) {
    return new Error(JSON.parse(data.data).error.message);
  });

mixi.mobile = function (isMobile) {
  if (isMobile) {
    this.authPath('https://m.mixi.jp/connect_authorize.pl');
  }
  return this;
};

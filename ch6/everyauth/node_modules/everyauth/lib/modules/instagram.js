var oauthModule = require('./oauth2')
  , querystring= require('querystring');

var instagram = module.exports =
oauthModule.submodule('instagram')
  .configurable({
      display: 'set to "touch" if you want users to see a mobile optimized version of the auth page'
    , scope: 'specify types of access (space separated if > 1): basic (default), comments, relationships, likes'
  })

  .oauthHost('https://api.instagram.com')
  .apiHost('https://api.instagram.com/v1')

  .entryPath('/auth/instagram')
  .callbackPath('/auth/instagram/callback')

  .authQueryParam('response_type', 'code')
  .authQueryParam('display', function () {
    return this._display && this.display();
  })
  .authQueryParam('scope', function () {
    return this._scope && this.scope();
  })

  .accessTokenParam('grant_type', 'authorization_code')
  .postAccessTokenParamsVia('data')

  .fetchOAuthUser( function (accessToken) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/users/self', accessToken, function (err, data) {
      if (err) return p.fail(err.error_message);
      var oauthUser = JSON.parse(data).data;
      p.fulfill(oauthUser);
    })
    return p;
  })
  .convertErr( function (data) {
    return new Error(data.error_message);
  });

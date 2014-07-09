var oauthModule = require('./oauth2')
  , request = require('request');

var soundcloud = module.exports =
oauthModule.submodule('soundcloud')
  .configurable({
      scope: 'specify types of access: (no scope), non-expiring'
    , display: 'specify type of auth dialog: (no display), popup'
  })
  .apiHost('https://api.soundcloud.com')
  .oauthHost('https://api.soundcloud.com')
  .authPath('/connect')
  .accessTokenPath('/oauth2/token')
  .entryPath('/auth/soundcloud')
  .callbackPath('/auth/soundcloud/callback')
  .authQueryParam('response_type', 'code')
  .authQueryParam('scope', function () {
    return this._scope && this.scope();
  })
  .authQueryParam('display', function () {
    return this._display && this.display();
  })
  .accessTokenHttpMethod('post')
  .postAccessTokenParamsVia('data')
  .accessTokenParam('grant_type', 'authorization_code')
  .fetchOAuthUser(function (accessToken) {
    var promise = this.Promise();
    request.get({
        url: this.apiHost() + '/me.json'
      , qs: {oauth_token: accessToken}
    }, function (err, res, body) {
      if (err) return promise.fail(err);
      if (parseInt(res.statusCode / 100, 10) !== 2) {
        return promise.fail(body);
      }
      return promise.fulfill(JSON.parse(body));
    });

    return promise;
  });

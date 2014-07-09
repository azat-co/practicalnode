var oauthModule = require('./oauth');

module.exports =
oauthModule.submodule('500px')
  .apiHost('https://api.500px.com/v1')
  .oauthHost('https://api.500px.com/v1')
  .entryPath('/auth/500px')
  .callbackPath('/auth/500px/callback')
  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/users', accessToken, accessTokenSecret, function (err, data) {
      if (err) { return p.fail(err); }
      var oauthUser = JSON.parse(data);
      p.fulfill(oauthUser);
    });
    return p;
  });

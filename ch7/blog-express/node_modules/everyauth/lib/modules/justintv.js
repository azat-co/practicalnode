var oauthModule = require('./oauth');

module.exports =
oauthModule.submodule('justintv')

  .apiHost('http://api.justin.tv')
  .oauthHost('http://api.justin.tv')

  .entryPath('/auth/justintv')
  .callbackPath('/auth/justintv/callback')

  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var promise = this.Promise();
    this.oauth.get(this.apiHost() + '/api/account/whoami.json', accessToken, accessTokenSecret, function (err, data) {
      if (err) return promise.fail(err);
      var oauthUser = JSON.parse(data);
      return promise.fulfill(oauthUser);
    });
    return promise;
  })
  
  .convertErr( function (data) {
    return new Error(data.data);
  });

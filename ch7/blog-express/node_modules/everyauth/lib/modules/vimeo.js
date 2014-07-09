var oauthModule = require('./oauth');

var vimeo = module.exports =
oauthModule.submodule('vimeo')

  .apiHost('http://vimeo.com/api/rest/v2')
  .oauthHost('http://vimeo.com')

  .entryPath('/auth/vimeo')
  .callbackPath('/auth/vimeo/callback')

  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var promise = this.Promise();
    this.oauth.get(this.apiHost() + '?format=json&method=vimeo.people.getInfo&user_id=' + accessTokenSecret, accessToken, accessTokenSecret, function (err, data) {
      if (err) return promise.fail(err);
      var oauthUser = JSON.parse(data);
      return promise.fulfill(oauthUser.person);
    });
    return promise;
  });

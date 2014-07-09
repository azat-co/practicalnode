var oauthModule = require('./oauth')
  , OAuth = require('oauth').OAuth;

var yahoo = module.exports =
oauthModule.submodule('yahoo')
  .definit( function () {
    var oauth = this.oauth = new OAuth(
        this.oauthHost() + this.requestTokenPath()
      , this.oauthHost() + this.accessTokenPath()
      , this.consumerKey()
      , this.consumerSecret()
      , '1.0', null, 'HMAC-SHA1');
  })
  .apiHost('http://social.yahooapis.com/v1')
  .oauthHost('https://api.login.yahoo.com/oauth/v2')

  .requestTokenPath('/get_request_token')
  .accessTokenPath('/get_token')
  .authorizePath('/request_auth')

  .entryPath('/auth/yahoo')
  .callbackPath('/auth/yahoo/callback')

  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var promise = this.Promise();
    this.oauth.get(this.apiHost() + '/user/' + params.xoauth_yahoo_guid + '/profile?format=json', accessToken, accessTokenSecret, function (err, data) {
      if (err) return promise.fail(err);
      var oauthUser = JSON.parse(data).profile;
      promise.fulfill(oauthUser);
    });
    return promise;
  });

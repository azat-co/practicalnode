var oauthModule = require('./oauth'),
    OAuth = require('oauth').OAuth;
	var mendeley = module.exports =
	oauthModule.submodule('mendeley')
	
  // http://apidocs.mendeley.com/home/authentication
	.apiHost('http://api.mendeley.com/oapi')
  .oauthHost('http://www.mendeley.com/oauth')

  .requestTokenPath('/request_token/')
	.accessTokenPath('/access_token/')
  .authorizePath('/authorize/')

  // oauth_callback not allowed
  .sendCallbackWithAuthorize(false)

  .entryPath('/auth/mendeley')
  .callbackPath('/auth/mendeley/callback')
  .definit( function () {
    this.oauth = new OAuth(
        this.oauthHost() + this.requestTokenPath()
      , this.oauthHost() + this.accessTokenPath()
      , this.consumerKey()
      , this.consumerSecret()
      , '1.0', null, 'HMAC-SHA1');

    // Mendeley does not support POST requests
    this.oauth.setClientOptions({
      "requestTokenHttpMethod": "GET",
      "accessTokenHttpMethod": "GET"
    });
  })
  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/profiles/info/me/', accessToken, accessTokenSecret, function (err, data) {
      if (err) return p.fail(err.error_message);
      var oauthUser = JSON.parse(data);
      p.fulfill(oauthUser);
    })
    return p;
  })
  .convertErr( function (data) {
    return new Error(data.error_message);
  });
  

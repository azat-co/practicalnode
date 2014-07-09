var oauthModule = require('./oauth');

	var readability = module.exports =
	oauthModule.submodule('readability')
	
	.apiHost('https://www.readability.com/api/rest/v1')
  .oauthHost('https://www.readability.com/api/rest/v1/oauth')

  .requestTokenPath('/request_token')
	.authorizePath('/authorize')
	.accessTokenPath('/access_token')

  .entryPath('/auth/readability')
  .callbackPath('/auth/readability/callback')

  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/users/_current', accessToken, accessTokenSecret, function (err, data) {
      if (err) return p.fail(err.error_message);
      var oauthUser = JSON.parse(data);
      p.fulfill(oauthUser);
    })
    return p;
  })
  .convertErr( function (data) {
    return new Error(data.error_message);
  });
  

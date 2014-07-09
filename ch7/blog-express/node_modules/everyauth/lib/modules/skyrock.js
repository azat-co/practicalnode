var oauthModule = require('./oauth')
	, Parser = require('xml2js').Parser;

var skyrock = module.exports =
	oauthModule.submodule('skyrock')
		.apiHost('https://api.skyrock.com/v2')
		.oauthHost('https://api.skyrock.com/v2')
		.requestTokenPath("/oauth/initiate")
		.accessTokenPath("/oauth/token")
		.authorizePath("/oauth/authorize")
		.entryPath('/auth/skyrock')
		.callbackPath('/auth/skyrock/callback')
		.sendCallbackWithAuthorize(false)
		.fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
			var promise = this.Promise();
			this.oauth.get(this.apiHost() + '/user/get.json', accessToken, accessTokenSecret, function (err, data) {
				data = JSON.parse(data);
				promise.fulfill(data);
			});
			return promise;
		})
		.convertErr( function (data) {
			return data.data;
		});

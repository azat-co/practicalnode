var oauthModule = require('./oauth')
  , Parser = require('xml2js').Parser;

var twitter = module.exports =
oauthModule.submodule('tumblr')
  .apiHost('http://www.tumblr.com/api')
  .oauthHost('http://www.tumblr.com')
  .entryPath('/auth/tumblr')
  .callbackPath('/auth/tumblr/callback')
  .sendCallbackWithAuthorize(false)
  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var promise = this.Promise();
    this.oauth.get(this.apiHost() + '/authenticate', accessToken, accessTokenSecret, function (err, data) {
      if (err) return promise.fail(err);
      var parser = new Parser();
      parser.on('end', function (result) {
        var oauthUser = result.tumblelog['@'];
        promise.fulfill(oauthUser);
      });
      parser.parseString(data);
    });
    return promise;
  })
  .convertErr( function (data) {
    return data.data;
  });

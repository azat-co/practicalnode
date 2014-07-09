var oauthModule = require('./oauth')
  , extractHostname = require('../utils').extractHostname;

var google = module.exports =
oauthModule.submodule('google1')
  .configurable({
      scope: "URL identifying the Google service to be accessed. See the documentation for the API you'd like to use for what scope to specify. To specify more than one scope, list each one separated with a space."
  })
  .apiHost('https://www.google.com')
  .oauthHost('https://www.google.com')

  .entryPath('/auth/google1')
  .callbackPath('/auth/google1/callback')

  .requestTokenPath('/accounts/OAuthGetRequestToken')
  .authorizePath('/accounts/OAuthAuthorizeToken')
  .accessTokenPath('/accounts/OAuthGetAccessToken')

  .requestTokenQueryParam({
      access_type: 'offline'
    , approval_prompt: 'force'
    , scope: function () {
        return this._scope && this.scope();
      }
  })

  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var promise = this.Promise()
      , userUrl = 'https://www.google.com/m8/feeds/contacts/default/full?alt=json';
    this.oauth.get(userUrl, accessToken, accessTokenSecret, function (err, data, res) {
      if (err) {
        err.extra = {data: data, res: res};
        return promise.fail(err);
      }
      var oauthUser = JSON.parse(data)
        , user = { gmail: oauthUser.feed.id.$t };
      promise.fulfill(user);
    });
    return promise;
  })
  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var twitterResponse = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          twitterResponse.statusCode
        , twitterResponse.headers);
      serverResponse.end(err.extra.data);
    } else if (err.statusCode) {
      var serverResponse = seqValues.res;
      serverResponse.writeHead(err.statusCode);
      serverResponse.end(err.data);
    } else {
      console.error(err);
      throw new Error('Unsupported error type');
    }
  });

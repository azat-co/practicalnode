var oauthModule = require('./oauth2');

module.exports =
oauthModule.submodule('angellist')
  .configurable({
      scope: 'specify types of access: (no scope), user, public_repo, repo, gist'
  })

  .oauthHost('https://angel.co')
  .apiHost('https://api.angel.co/1')

  .authPath('/api/oauth/authorize')
  .authQueryParam('response_type', 'code')

  .accessTokenPath('/api/oauth/token')
  .accessTokenParam('grant_type', 'authorization_code')

  .entryPath('/auth/angellist')
  .callbackPath('/auth/angellist/callback')

  .fetchOAuthUser( function (accessToken) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/me', accessToken, function (err, data) {
      if (err) return p.fail(err);
      var oauthUser = JSON.parse(data);
      p.fulfill(oauthUser);
    })
    return p;
  })
  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var angellistResponse = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          angellistResponse.statusCode
        , angellistResponse.headers);
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

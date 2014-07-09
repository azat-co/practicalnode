var oauthModule = require('./oauth2');

module.exports =
oauthModule.submodule('37signals')
  .configurable({
      scope: 'specify types of access: (no scope), user, public_repo, repo, gist'
  })

  .oauthHost('https://launchpad.37signals.com')
  .apiHost('https://launchpad.37signals.com')

  .authPath('/authorization/new')
  .authQueryParam('type', 'web_server')

  .accessTokenPath('/authorization/token')
  .accessTokenParam('type', 'web_server')

  .postAccessTokenParamsVia('data')

  .entryPath('/auth/37signals')
  .callbackPath('/auth/37signals/callback')

  .fetchOAuthUser( function (accessToken) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/authorization.json', accessToken, function (err, data) {
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
      var _37sigResponse = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          _37sigResponse.statusCode
        , _37sigResponse.headers);
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

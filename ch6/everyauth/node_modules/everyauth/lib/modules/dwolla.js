var oauthModule = require('./oauth2')
  , request = require('request');

var dwolla = module.exports =
oauthModule.submodule('dwolla')
  .configurable({
    scope: 'specify types of access: accountinfofull|request|contacts|balance|send|transactions'
  })

  .oauthHost('https://www.dwolla.com')
  .apiHost('https://www.dwolla.com/oauth/rest')

  .authPath('/oauth/v2/authenticate')
  .accessTokenPath('/oauth/v2/token')
  .accessTokenParam('grant_type', 'authorization_code')

  .entryPath('/auth/dwolla')
  .callbackPath('/auth/dwolla/callback')

  .authQueryParam('scope', function () {
    return this._scope && this.scope();
  })

  .authQueryParam('response_type', 'code')

  .fetchOAuthUser( function (accessToken) {
    var promise = this.Promise();
    request.get({
        url: this.apiHost() + '/users'
      , qs: { oauth_token: accessToken, alt: 'json' }
    }, function (err, res, body) {
      if (err) {
        err.extra = {res: res, data: body};
        return promise.fail(err);
      }
      if (parseInt(res.statusCode/100, 10) !== 2) {
        return promise.fail({extra: {data: body, res: res}});
      }
      var oauthUser = JSON.parse(body).Response;
      return promise.fulfill(oauthUser);
    });

    return promise;
  })
  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var dwollaResponse = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          dwollaResponse.statusCode
        , dwollaResponse.headers);
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

var oauthModule = require('./oauth2')
  , request = require('request');

var gowalla = module.exports =
oauthModule.submodule('gowalla')
  .apiHost('https://api.gowalla.com')
  .oauthHost('https://gowalla.com')

  .authPath('/api/oauth/new')
  .accessTokenPath('https://api.gowalla.com/api/oauth/token')

  .entryPath('/auth/gowalla')
  .callbackPath('/auth/gowalla/callback')

  .accessTokenHttpMethod('post')
  .postAccessTokenParamsVia('data')
  .accessTokenParam('grant_type', 'authorization_code')

  .fetchOAuthUser( function (accessToken) {
    var promise = this.Promise();
    request.get({
        url: this._apiHost + '/users/me'
      , qs: { oauth_token: accessToken }
      , headers: {
            "X-Gowalla-API-Key": this.appId()
          , "Accept": "application/json"
        }
    }, function (err, res, body) {
      if (err) {
        err.extra = {res: res, data: body};
        return promise.fail(err);
      }
      if (parseInt(res.statusCode/100, 10) !== 2) {
        return promise.fail({extra: {data: body, res: res}});
      }
      var oauthUser = JSON.parse(body);
      return promise.fulfill(oauthUser);
    });

    return promise;
  })

  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var gowallaResponse = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          gowallaResponse.statusCode
        , gowallaResponse.headers);
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

var oauthModule = require('./oauth2')
  , request = require('request');

var foursquare = module.exports =
oauthModule.submodule('foursquare')
  .apiHost('https://api.foursquare.com/v2')
  .oauthHost('https://foursquare.com')

  .authPath('/oauth2/authenticate')
  .accessTokenPath('/oauth2/access_token')

  .entryPath('/auth/foursquare')
  .callbackPath('/auth/foursquare/callback')

  .authQueryParam('response_type', 'code')

  .accessTokenHttpMethod('get')
  .accessTokenParam('grant_type', 'authorization_code')

  .fetchOAuthUser( function (accessToken) {
    var promise = this.Promise()
      , userUrl = this.apiHost() + '/users/self'
      , queryParams = { oauth_token: accessToken }
    request.get({ url: userUrl, qs: queryParams}, function (err, res, body) {
      if (err) {
        err.extra = {res: res, data: body};
        return promise.fail(err);
      }
      if (parseInt(res.statusCode/100, 10) !== 2) {
        return promise.fail({extra: {data: body, res: res}});
      }
      var oauthUser = JSON.parse(body).response.user;
      return promise.fulfill(oauthUser);
    });
    return promise;
  })
  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var foursquareResponse = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          foursquareResponse.statusCode
        , foursquareResponse.headers);
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

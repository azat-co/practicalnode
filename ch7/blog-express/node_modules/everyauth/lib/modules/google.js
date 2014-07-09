var oauthModule = require('./oauth2')
  , url = require('url')
  , request = require('request');

var google = module.exports =
oauthModule.submodule('google')
  .configurable({
      scope: "URL identifying the Google service to be accessed. See the documentation for the API you'd like to use for what scope to specify. To specify more than one scope, list each one separated with a space."
  })

  .oauthHost('https://accounts.google.com')
  .apiHost('https://www.google.com/m8/feeds')

  .authPath('/o/oauth2/auth')
  .authQueryParam('response_type', 'code')

  .accessTokenPath('/o/oauth2/token')
  .accessTokenParam('grant_type', 'authorization_code')
  .accessTokenHttpMethod('post')
  .postAccessTokenParamsVia('data')

  .entryPath('/auth/google')
  .callbackPath('/auth/google/callback')

  .authQueryParam({
      access_type: 'offline'
    , approval_prompt: 'force'
    , scope: function () {
        return this._scope && this.scope();
      }
  })

  .addToSession( function (sess, auth) {
    this._super(sess, auth);
    if (auth.refresh_token) {
      sess.auth[this.name].refreshToken = auth.refresh_token;
      sess.auth[this.name].expiresInSeconds = parseInt(auth.expires_in, 10);
    }
  })

  .authCallbackDidErr( function (req) {
    var parsedUrl = url.parse(req.url, true);
    return parsedUrl.query && !!parsedUrl.query.error;
  })

  .handleAuthCallbackError( function (req, res) {
    var parsedUrl = url.parse(req.url, true)
      , errorDesc = parsedUrl.query.error + "; " + parsedUrl.query.error_description;
    if (res.render) {
      res.render(__dirname + '/../views/auth-fail.jade', {
        errorDescription: errorDesc
      });
    } else {
      // TODO Replace this with a nice fallback
      throw new Error("You must configure handleAuthCallbackError if you are not using express");
    }
  })
  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var googleResponse = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          googleResponse.statusCode
        , googleResponse.headers);
      serverResponse.end(err.extra.data);
    } else if (err.statusCode) {
      var serverResponse = seqValues.res;
      serverResponse.writeHead(err.statusCode);
      serverResponse.end(err.data);
    } else {
      console.error(err);
      throw new Error('Unsupported error type');
    }
  })

  .fetchOAuthUser( function (accessToken) {
    var promise = this.Promise()
      , userUrl = 'https://www.googleapis.com/oauth2/v1/userinfo'
      , queryParams = { access_token: accessToken, alt: 'json' };
    request.get({
        url: userUrl
      , qs: queryParams
    }, function (err, res, body) {
      if (err) return promise.fail(err);
      if (parseInt(res.statusCode/100, 10) !== 2) {
        return promise.fail({extra: {data: body, res: res}});
      }
      promise.fulfill(JSON.parse(body));
    });
    return promise;
  });

/**
 * @param {Object} params in an object that includes the keys:
 * - refreshToken: The refresh token returned from the authorization code
 *   exchange
 * - clientId: The client_id obtained during application registration
 * - clientSecret: The client secret obtained during the application registration
 * @param {Function} cb
 */
google.refreshToken = function (params, cb) {
  request.post('https://accounts.google.com/o/oauth2/token', {
    form: {
      refresh_token: params.refreshToken
    , client_id: params.clientId
    , client_secret: params.clientSecret
    , grant_type: 'refresh_token'
    }
  }, function (err, res, body) {
    // `body` should look like:
    // {
    //   "access_token":"1/fFBGRNJru1FQd44AzqT3Zg",
    //   "expires_in":3920,
    //   "token_type":"Bearer",
    // }
    if (err) return cb(err);
    if (parseInt(res.statusCode / 100, 10) !== 2) {
      cb(null, {}, res);
    } else {
      body = JSON.parse(body);
      cb(null, {
        accessToken: body.access_token
      , expiresIn: body.expires_in
      , idToken: body.id_token
      }, res);
    }
  });
  return this;
}

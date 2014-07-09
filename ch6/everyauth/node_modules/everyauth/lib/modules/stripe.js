var oauthModule = require('./oauth2'),
    url = require('url'),
    request = require('request');

var stripe = module.exports =
oauthModule.submodule('stripe')

  .configurable({
    scope: "A space seperated list of scope values of Stripe scopes to be accessed.  See the documentation to determine what scope you'd like to specify.  If not specified, it will default to: read_only",
    landing: "Set to login or register depending on what type of screen you want your users to see.  Defaults to login scope for read_only and register for scope for read_write"
  })

  .oauthHost('https://connect.stripe.com')
  .apiHost('https://api.stripe.com')

  .authPath('/oauth/authorize')
  .authQueryParam('response_type', 'code')

  .authQueryParam('stripe_landing', function () {
    return this._landing && this.landing();
  })

  .accessTokenPath('/oauth/token')
  .accessTokenParam('grant_type', 'authorization_code')
  .accessTokenHttpMethod('post')

  .entryPath('/auth/stripe')
  .callbackPath('/auth/stripe/callback')

  .authQueryParam('scope', function () {
    return this._scope && this.scope();
  })

  .authCallbackDidErr( function (req) {
    var parsedUrl = url.parse(req.url, true);
    return parsedUrl.query && !!parsedUrl.query.error;
  })

  .handleAuthCallbackError( function (req, res) {
    var parsedUrl = url.parse(req.url, true),
        errorDesc = parsedUrl.query.error + "; " + parsedUrl.query.error_description;
    if (res.render) {
      res.render(__dirname + '/../views/auth-fail.jade', {
        errorDescription: errorDesc
      });
    } else {
      // TODO Replace this with a nice fallback
      throw new Error("You must configure handleAuthCallbackError if you are not using express");
    }
  })

  .fetchOAuthUser( function (accessToken, authResponse) {
    //var user = authResponse;
    var p = this.Promise();

    request.get({
      url: this.apiHost() + '/v1/account',
      headers: {'Authorization': 'Bearer ' + accessToken}
    }, function(err, res, body) {
      if(err){
        return p.fail(err);
      } else {
        if(parseInt(res.statusCode/100,10) !=2) {
          return p.fail({extra:{data:body, res: res}});
        }
        var oAuthUser = JSON.parse(body);
        p.fulfill(oAuthUser);
      }
    });
    return p;
  })

  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var stripeResponse = err.extra.res, 
          serverResponse = seqValues.res;
      serverResponse.writeHead(
          stripeResponse.statusCode, 
          stripeResponse.headers);
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

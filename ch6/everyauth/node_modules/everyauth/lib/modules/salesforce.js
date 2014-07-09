var oauthModule = require('./oauth2'),
    url = require('url'),
    request = require('request');

var salesforce = module.exports =
oauthModule.submodule('salesforce')

  .configurable({
    scope: "A space seperated list of scope values of Salesforce scopes to be accessed.  See the documentation to determine what scope you'd like to specify.  If not specified, it will default to: api refresh_token"
  })

  .oauthHost('https://login.salesforce.com')
  .apiHost('https://login.salesforce.com')

  .authPath('/services/oauth2/authorize')
  .authQueryParam('response_type', 'code')

  .accessTokenPath('/services/oauth2/token')
  .accessTokenParam('grant_type', 'authorization_code')
  .accessTokenHttpMethod('post')
  .postAccessTokenParamsVia('data')

  .entryPath('/auth/salesforce')
  .callbackPath('/auth/salesforce/callback')

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
    var p = this.Promise();

    request.get({
      url: authResponse.extra.id,
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
      var salesforceResponse = err.extra.res,
          serverResponse = seqValues.res;
      serverResponse.writeHead(
          salesforceResponse.statusCode,
          salesforceResponse.headers);
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
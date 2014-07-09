var oauthModule = require('./oauth2')
  , request = require('request');

var mailchimp = module.exports =
oauthModule.submodule('mailchimp')
  .configurable({
    metadataPath: "Although this shouldn't be changed, this is where we get the datacenter for building the API key."
  })
  .oauthHost('https://login.mailchimp.com')
  .authPath('/oauth2/authorize')
  .accessTokenPath('/oauth2/token')
  .metadataPath('/oauth2/metadata')

  .entryPath('/auth/mailchimp')
  .callbackPath('/auth/mailchimp/callback')
  .fetchOAuthUser( function (accessToken) {
    var promise = this.Promise();
    this.oauth._request("GET", this.oauthHost() + this.metadataPath(), {
      Authorization: 'OAuth ' + accessToken
    },"","", function (err, data){
      if (err) return promise.fail(err);

      var metadata = JSON.parse(data)
        , apikey = accessToken + "-"+ metadata.dc;

      request.post({
          url: metadata.api_endpoint + '/1.3/?method=getAccountDetails'
        , form: {apikey: apikey}
      }, function (err, res, body) {
        if (err) {
          err.extra = {res: res, data: body};
          return promise.fail(err);
        }
        if (parseInt(res.statusCode/100, 10) !== 2) {
          return promise.fail({extra: {data: body, res: res}});
        }
        var oauthUser = JSON.parse(body);
        oauthUser.apikey = apikey;
        return promise.fulfill(oauthUser);
      });
    });
    return promise;
  })
  .postAccessTokenParamsVia("data")
  .authQueryParam('response_type','code')
  .accessTokenParam('grant_type','authorization_code')

  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var mailchimpResponse = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          mailchimpResponse.statusCode
        , mailchimpResponse.headers);
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

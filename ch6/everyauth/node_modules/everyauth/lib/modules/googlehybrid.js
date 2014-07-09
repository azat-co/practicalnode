var openidModule = require('./openid')
  , OAuth = require('oauth').OAuth
  , oid = require('openid')
  , extractHostname = require('../utils').extractHostname;

var googlehybrid = module.exports =
openidModule.submodule('googlehybrid')
  .configurable({
       scope: 'array of desired google api scopes'
     , consumerKey: 'Consumer Key'
     , consumerSecret: 'Consumer Secret'
  })
  .definit( function () {
    this.relyingParty =
      new oid.RelyingParty(this._myHostname + this._callbackPath, null, false, false, [
          new oid.AttributeExchange({
              'http://axschema.org/contact/email': 'required'
            , 'http://axschema.org/namePerson/first': 'required'
            , 'http://axschema.org/namePerson/last': 'required'
          })
        , new oid.OAuthHybrid({
              consumerKey: this._consumerKey
            , scope: this._scope.join(' ')
          })
      ]);

    this.oauth = new OAuth(
        'https://www.google.com/accounts/OAuthGetRequestToken'
      , 'https://www.google.com/accounts/OAuthGetAccessToken'
      , this._consumerKey
      , this._consumerSecret
      , "1.0",  null, "HMAC-SHA1");
  })
  .verifyAttributes(function (req,res) {
    var p = this.Promise()
        oauth = this.oauth;
    this.relyingParty.verifyAssertion(req, function (err, userAttributes) {
      if(err) return p.fail(err);
      oauth.getOAuthAccessToken(userAttributes['request_token'], undefined, function (err, oauthAccessToken, oauthAccessTokenSecret) {
        if (err) return p.fail(err);
        userAttributes['access_token'] = oauthAccessToken;
        userAttributes['access_token_secret'] = oauthAccessTokenSecret;
        p.fulfill(userAttributes)
      });
    });
    return p;
  })
  .sendToAuthenticationUri(function (req, res) {

    // Automatic hostname detection + assignment
    if (!this._myHostname || this._alwaysDetectHostname) {
      this.myHostname(extractHostname(req));
    }
    
    var self = this;
    
    this.relyingParty.authenticate('http://www.google.com/accounts/o8/id', false, function (err,authenticationUrl){
      if(err) return p.fail(err);
      self.redirect(res, authenticationUrl);
    });
  }) 
  .entryPath('/auth/googlehybrid')
  .callbackPath('/auth/googlehybrid/callback');

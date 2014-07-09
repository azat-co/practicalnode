var everyModule = require('./everymodule')
  , oid = require('openid')
  , url = require('url')
  , extractHostname = require('../utils').extractHostname;

var openid = module.exports =
everyModule.submodule('openid')
  .configurable({
      simpleRegistration: 'e.g., {"nickname" : true}'
    , attributeExchange: 'eg {"http://axschema.org/contact/email": "required"}'
    , myHostname: 'e.g., http://localhost:3000 . Notice no trailing slash'
    , alwaysDetectHostname: 'does not cache myHostname once. Instead, re-detect it on every request. Good for multiple subdomain architectures'
    , redirectPath : 'The path to redirect To' 
    , openidURLField : 'The post field to use for open id'
  })
  .definit( function () {
    this.relyingParty = new oid.RelyingParty(this.myHostname() + this.callbackPath(), null, false, false, [
        new oid.UserInterface()
      , new oid.SimpleRegistration(this.simpleRegistration())
      , new oid.AttributeExchange(this.attributeExchange())
    ]);
  })
  .get('entryPath',
  'the link a user follows, whereupon you kick off the OpenId auth process - e.g., "/auth/openid"')
    .step('sendToAuthenticationUri')
      .description('sends the user to the providers openid authUrl')
      .accepts('req res next')
      .promises(null)
  .get('callbackPath',
  'the callback path that the 3rd party Openid provider redirects to after an authorization result - e.g., "/auth/openid/callback"')
    .step('verifyAttributes')
      .description('verifies the return attributes')
      .accepts('req res next')
      .promises('userAttributes')
    .step('getSession')
      .accepts('req')
      .promises('session')
    .step('findOrCreateUser')
      .accepts('session userAttributes')
      .promises('user')
    .step('addToSession')
      .accepts('session user')
      .promises(null)
    .step('sendResponse')
      .accepts('res')
      .promises(null)
  .sendToAuthenticationUri(function(req,res) {

    // Automatic hostname detection + assignment
    if (!this._myHostname || this._alwaysDetectHostname) {
      this.myHostname(extractHostname(req));
    }
    
    var p = this.Promise();

    this.relyingParty.authenticate(req.query[this.openidURLField()], false, (function(err,authenticationUrl){
      if(err) return p.fail(err);
      this.redirect(res, authenticationUrl);
    }).bind(this));

    p.fulfill();
    return p;
  })
  .getSession( function(req) {
    return req.session;
  })
  .verifyAttributes(function(req,res) {
    var p = this.Promise();
    this.relyingParty.verifyAssertion(req, function (err,userAttributes) {
      if(err) return p.fail(err);
      p.fulfill(userAttributes)
    });
    return p;
  })
  .addToSession( function (sess, user) {
    var _auth = sess.auth || (sess.auth = {})
      , mod = _auth[this.name] || (_auth[this.name] = {});
    _auth.loggedIn = true;
    _auth.userId = user[this._userPkey];
    mod.user = user;
  })
  .sendResponse( function (res) {
    var redirectTo = this.redirectPath();
    if (!redirectTo)
      throw new Error('You must configure a redirectPath');
    this.redirect(res, redirectTo);
  })
  .redirectPath('/')
  .entryPath('/auth/openid')
  .callbackPath('/auth/openid/callback')
  .simpleRegistration({
      "nickname" : true
    , "email"    : true
    , "fullname" : true
    , "dob"      : true
    , "gender"   : true
    , "postcode" : true
    , "country"  : true
    , "language" : true
    , "timezone" : true
  })
  .attributeExchange({
      "http://axschema.org/contact/email"       : "required"
    , "http://axschema.org/namePerson/friendly" : "required"
    , "http://axschema.org/namePerson"          : "required"
    , "http://axschema.org/namePerson/first"    : "required"
    , "http://axschema.org/contact/country/home": "required"
    , "http://axschema.org/media/image/default" : "required"
    , "http://axschema.org/x/media/signature"   : "required"
  })
  .openidURLField('openid_identifier');

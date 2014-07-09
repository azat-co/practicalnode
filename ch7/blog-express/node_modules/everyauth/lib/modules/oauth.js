var everyModule = require('./everymodule')
  , OAuth = require('oauth').OAuth
  , url = require('url')
  , extractHostname = require('../utils').extractHostname;

var oauth = module.exports =
everyModule.submodule('oauth')
  .configurable({
      apiHost: 'e.g., https://api.twitter.com'
    , oauthHost: 'the host for the OAuth provider'
    , requestTokenPath: "the path on the OAuth provider's domain where we request the request token, e.g., /oauth/request_token"
    , accessTokenPath: "the path on the OAuth provider's domain where we request the access token, e.g., /oauth/access_token"
    , authorizePath: 'the path on the OAuth provider where you direct a visitor to login, e.g., /oauth/authorize'
    , sendCallbackWithAuthorize: 'whether you want oauth_callback=... as a query param send with your request to /oauth/authorize'
    , consumerKey: 'the api key provided by the OAuth provider'
    , consumerSecret: 'the api secret provided by the OAuth provider'
    , myHostname: 'e.g., http://localhost:3000 . Notice no trailing slash'
    , alwaysDetectHostname: 'does not cache myHostname once. Instead, re-detect it on every request. Good for multiple subdomain architectures'
    , redirectPath: 'Where to redirect to after a failed or successful OAuth authorization'
    , convertErr: '(DEPRECATED) a function (data) that extracts an error message from data arg, where `data` is what is returned from a failed OAuth request'
    , authCallbackDidErr: 'Define the condition for the auth module determining if the auth callback url denotes a failure. Returns true/false.'
  })
  .definit( function () {
    this.oauth = new OAuth(
        this.oauthHost() + this.requestTokenPath()
      , this.oauthHost() + this.accessTokenPath()
      , this.consumerKey()
      , this.consumerSecret()
      , '1.0', null, 'HMAC-SHA1');
  })

  .get('entryPath',
       'the link a user follows, whereupon you redirect them to the 3rd party OAuth provider dialog - e.g., "/auth/twitter"')
    .step('getRequestToken')
      .description('asks OAuth Provider for a request token')
      .accepts('req res next')
      .promises('token tokenSecret')
    .step('storeRequestToken')
      .description('stores the request token and secret in the session')
      .accepts('req token tokenSecret')
      .promises(null)
    .step('redirectToProviderAuth')
      .description('sends the user to authorization on the OAuth provider site')
      .accepts('res token')
      .promises(null)

  .get('callbackPath',
       'the callback path that the 3rd party OAuth provider redirects to after an OAuth authorization result - e.g., "/auth/twitter/callback"')
    .step('extractTokenAndVerifier')
      .description('extracts the request token and verifier from the url query')
      .accepts('req res next')
      .promises('requestToken verifier')
      .canBreakTo('handleDuplicateCallbackRequest')
      .canBreakTo('authCallbackErrorSteps')
    .step('getSession')
      .accepts('req')
      .promises('session')
    .step('rememberTokenSecret')
      .description('retrieves the request token secret from the session')
      .accepts('session')
      .promises('requestTokenSecret')
    .step('getAccessToken')
      .description('requests an access token from the OAuth provider')
      .accepts('requestToken requestTokenSecret verifier')
      .promises('accessToken accessTokenSecret params')
    .step('fetchOAuthUser')
      .accepts('accessToken accessTokenSecret params')
      .promises('oauthUser')
    .step('assignOAuthUserToSession')
      .accepts('oauthUser session')
      .promises('session')
    .step('findOrCreateUser')
      .accepts('session accessToken accessTokenSecret oauthUser')
      .promises('user')
    .step('compileAuth')
      .accepts('accessToken accessTokenSecret oauthUser user')
      .promises('auth')
    .step('addToSession')
      .accepts('session auth')
      .promises(null)
    .step('sendResponse')
      .accepts('res')
      .promises(null)

  .stepseq('handleDuplicateCallbackRequest',
    'handles the case if you manually click the callback link on Twitter, but Twitter has already sent a redirect request to the callback path with the same token')
    .step('waitForPriorRequestToWriteSession')
      .accepts('req res next')
      .promises(null)
    .step('sendResponse')

  .stepseq('authCallbackErrorSteps')
      .step('handleAuthCallbackError',
           'a request handler that intercepts a failed authorization message sent from the OAuth provider to your service. e.g., the request handler for "/auth/twitter/callback?denied=blahblahblahblahblah"')
        .accepts('req res next')
        .promises(null)

  .getRequestToken( function (req, res, next) {

    // Automatic hostname detection + assignment
    if (!this._myHostname || this._alwaysDetectHostname) {
      this.myHostname(extractHostname(req));
    }

    var p = this.Promise()
      , params = {oauth_callback: this._myHostname + this._callbackPath}
      , additionalParams = this.moreRequestTokenQueryParams
      , param;

    if (additionalParams) for (var k in additionalParams) {
      param = additionalParams[k];
      if ('function' === typeof param) {
        // e.g., for facebook module, param could be
        // function () {
        //   return this._scope && this.scope();
        // }
        additionalParams[k] = // cache the function call
          param = param.call(this);
      }
      if ('function' === typeof param) {
        // this.scope() itself could be a function
        // to allow for dynamic scope determination - e.g.,
        // function (req, res) {
        //   return req.session.onboardingPhase; // => "email"
        // }
        param = param.call(this, req, res);
      }
      params[k] = param;
    }
    this.oauth.getOAuthRequestToken(params, function (err, token, tokenSecret, params) {
      if (err) {
        return p.fail(err);
      }
      p.fulfill(token, tokenSecret);
    });
    return p;
  })
  .storeRequestToken( function (req, token, tokenSecret) {
    var sess = req.session
      , _auth = sess.auth || (sess.auth = {})
      , _provider = _auth[this.name] || (_auth[this.name] = {});
    _provider.token = token;
    _provider.tokenSecret = tokenSecret;
  })
  .redirectToProviderAuth( function (res, token) {
    // Note: Not all oauth modules need oauth_callback as a uri query parameter. As far as I know, only readability's
    // module needs it as a uri query parameter. However, in cases such as twitter, it allows you to over-ride
    // the callback url settings at dev.twitter.com from one place, your app code, rather than in two places -- i.e.,
    // your app code + dev.twitter.com app settings.
    var redirectTo = this._oauthHost + this._authorizePath + '?oauth_token=' + token;
    if (this._sendCallbackWithAuthorize) {
      redirectTo += '&oauth_callback=' + this._myHostname + this._callbackPath;
    }
    this.redirect(res, redirectTo);
  })

  // Steps for GET `callbackPath`
  .extractTokenAndVerifier( function (req, res, next) {
    if (this._authCallbackDidErr && this._authCallbackDidErr(req)) {
      return this.breakTo('authCallbackErrorSteps', req, res);
    }
    var parsedUrl = url.parse(req.url, true)
      , query = parsedUrl.query
      , requestToken = query && query.oauth_token
      , verifier = query && query.oauth_verifier

      , sess = req.session
      , promise
      , _auth = sess.auth || (sess.auth = {})
      , name = this.name
      , mod = _auth[name] || (_auth[name] = {});
    if ((name === 'twitter') && (mod.token === requestToken) && (mod.verifier === verifier)) {
      return this.breakTo('handleDuplicateCallbackRequest', req, res);
    }

    promise = this.Promise();
    mod.verifier = verifier;
    sess.save( function (err) {
      if (err) return promise.fail(err);
      promise.fulfill(requestToken, verifier);
    });
    return promise;
  })
  .getSession( function(req) {
    return req.session;
  })
  .rememberTokenSecret( function (sess) {
    return sess && sess.auth && sess.auth[this.name] && sess.auth[this.name].tokenSecret;
  })
  .getAccessToken( function (reqToken, reqTokenSecret, verifier) {
    var promise = this.Promise();
    this.oauth.getOAuthAccessToken(reqToken, reqTokenSecret, verifier, function (err, accessToken, accessTokenSecret, params) {
      if (err) return promise.fail(err);
      promise.fulfill(accessToken, accessTokenSecret, params);
    });
    return promise;
  })
  .assignOAuthUserToSession( function (oauthUser, session) {
    session.auth[this.name].user = oauthUser;
    return session;
  })
  .compileAuth( function (accessToken, accessTokenSecret, oauthUser, user) {
    return {
        accessToken: accessToken
      , accessTokenSecret: accessTokenSecret
      , oauthUser: oauthUser
      , user: user
    };
  })
  .addToSession( function (sess, auth) {
    var promise = this.Promise()
      , _auth = sess.auth
      , mod = _auth[this.name];
    _auth.loggedIn = true;
    _auth.userId || (_auth.userId = auth.user[this._userPkey]);
    mod.user = auth.oauthUser;
    mod.accessToken = auth.accessToken;
    mod.accessTokenSecret = auth.accessTokenSecret;
    // this._super() ?
    sess.save( function (err) {
      if (err) return promise.fail(err);
      promise.fulfill();
    });
    return promise;
  })
  .sendResponse( function (res, data) {
    var redirectTo = this.redirectPath();
    if (!redirectTo)
      throw new Error('You must configure a redirectPath');
    this.redirect(res, redirectTo);
  })
  .waitForPriorRequestToWriteSession( function (req, res, next) {
    var promise = this.Promise();
    function check (self, sess, res, promise) {
      if (sess.auth[self.name].accessToken) {
        return promise.fulfill();
      }

      setTimeout(function () {
        sess.reload( function (err) {
          if (err) return promise.fail(err);
          check(self, req.session, res, promise);
        });
      }, 100);
    }
    check(this, req.session, res, promise);
    return promise;
  });

// Defaults inherited by submodules
oauth
  .requestTokenPath('/oauth/request_token')
  .authorizePath('/oauth/authorize')
  .accessTokenPath('/oauth/access_token')
  .handleAuthCallbackError( function (req, res, next) {
    next(new Error("You must configure handleAuthCallbackError in this module"));
  })
  .sendCallbackWithAuthorize(true);

oauth.moreRequestTokenQueryParams = {};
oauth.cloneOnSubmodule.push('moreRequestTokenQueryParams');

// Add or over-write existing query params that
// get tacked onto the oauth authorize url.
oauth.requestTokenQueryParam = function (key, val) {
  if (arguments.length === 1 && key.constructor == Object) {
    for (var k in key) {
      this.requestTokenQueryParam(k, key[k]);
    }
    return this;
  }
  if (val)
    this.moreRequestTokenQueryParams[key] = val;
  return this;
};

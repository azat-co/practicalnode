var everyModule = require('./everymodule')
  , OAuth = require('oauth').OAuth2
  , url = require('url')
  , querystring = require('querystring')
  , request = require('request')
  , extractHostname = require('../utils').extractHostname;

// Steps define a sequence of logic that pipes data through
// a chain of promises. A new chain of promises is generated
// every time the set of steps is started.

var oauth2 = module.exports =
everyModule.submodule('oauth2')
  .definit( function () {
    this.oauth = new OAuth(this._appId, this._appSecret, this._oauthHost, this._authPath, this._accessTokenPath, this._customHeaders);
  })
  .configurable({
      apiHost: 'e.g., https://graph.facebook.com'
    , oauthHost: 'the host for the OAuth provider'
    , appId: 'the OAuth app id provided by the host'
    , appSecret: 'the OAuth secret provided by the host'
    , authPath: "the path on the OAuth provider's domain where " + 
                "we direct the user for authentication, e.g., /oauth/authorize"
    , accessTokenPath: "the path on the OAuth provider's domain " + 
                "where we request the access token, e.g., /oauth/access_token"
    , accessTokenHttpMethod: 'the http method ("get" or "post") with which to make our access token request'
    , customHeaders: 'any cusomt headers required in the access token request'
    , postAccessTokenParamsVia: '"query" to POST the params to the access ' + 
                'token endpoint as a querysting; "data" to POST the params to ' +
                'the access token endpoint in the request body'
    , myHostname: 'e.g., http://local.host:3000 . Notice no trailing slash'
    , alwaysDetectHostname: 'does not cache myHostname once. Instead, re-detect it on every request. Good for multiple subdomain architectures'
    , convertErr: '(DEPRECATED) a function (data) that extracts an error message from data arg, where `data` is what is returned from a failed OAuth request'
    , authCallbackDidErr: 'Define the condition for the auth module determining if the auth callback url denotes a failure. Returns true/false.'
  })

  // Declares a GET route that is aliased
  // as 'entryPath'. The handler for this route
  // triggers the series of steps that you see
  // indented below it.
  .get('entryPath',
       'the link a user follows, whereupon you redirect them to the 3rd party OAuth provider dialog - e.g., "/auth/facebook"')
    .step('getAuthUri')
      .accepts('req res next')
      .promises('authUri')
    .step('requestAuthUri')
      .accepts('res authUri')
      .promises(null)

  .get('callbackPath',
       'the callback path that the 3rd party OAuth provider redirects to after an OAuth authorization result - e.g., "/auth/facebook/callback"')
    .step('getCode')
      .description('retrieves a verifier code from the url query')
      .accepts('req res next')
      .promises('code')
      .canBreakTo('authCallbackErrorSteps')
    .step('getAccessToken')
      .accepts('code')
      .promises('accessToken extra')
    .step('fetchOAuthUser')
      .accepts('accessToken')
      .promises('oauthUser')
    .step('getSession')
      .accepts('req')
      .promises('session')
    .step('findOrCreateUser')
      //.optional()
      .accepts('session accessToken extra oauthUser')
      .promises('user')
    .step('compile')
      .accepts('accessToken extra oauthUser user')
      .promises('auth')
    .step('addToSession')
      .accepts('session auth')
      .promises(null)
    .step('sendResponse')
      .accepts('res')
      .promises(null)

  .stepseq('authCallbackErrorSteps')
      .step('handleAuthCallbackError',
           'a request handler that intercepts a failed authorization message sent from the OAuth2 provider to your service. e.g., the request handler for "/auth/facebook/callback?error_reason=user_denied&error=access_denied&error_description=The+user+denied+your+request."')
        .accepts('req res next')
        .promises(null)

  .getAuthUri( function (req, res, next) {

    // Automatic hostname detection + assignment
    if (!this._myHostname || this._alwaysDetectHostname) {
      this.myHostname(extractHostname(req));
    }

    var params = {
            client_id: this._appId
          , redirect_uri: this._myHostname + this._callbackPath
        }
      , authPath = this._authPath
      , url = (/^http/.test(authPath))
            ? authPath
            : (this._oauthHost + authPath)
      , additionalParams = this.moreAuthQueryParams
      , param;

    if (additionalParams) for (var k in additionalParams) {
      param = additionalParams[k];
      if ('function' === typeof param) {
        // e.g., for facebook module, param could be
        // function () {
        //   return this._scope && this.scope();
        // }
        param = param.call(this, req, res);
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
    return url + '?' + querystring.stringify(params);
  })
  .requestAuthUri( function (res, authUri) {
    this.redirect(res, authUri);
  })
  .getCode( function (req, res, next) {
    var parsedUrl = url.parse(req.url, true);
    if (this._authCallbackDidErr(req)) {
      return this.breakTo('authCallbackErrorSteps', req, res, next);
    }
    if (!parsedUrl.query || !parsedUrl.query.code) {
      console.error("Missing code in querystring. The url looks like " + req.url);
    }
    return parsedUrl.query && parsedUrl.query.code;
  })
  .getAccessToken( function (code, data) {
    var p = this.Promise()
      , params = {
            client_id: this._appId
          , redirect_uri: this._myHostname + this._callbackPath
          , code: code
          , client_secret: this._appSecret
        }
      , url = this._oauthHost + this._accessTokenPath
      , additionalParams = this.moreAccessTokenParams
      , param;

    if (this._accessTokenPath.indexOf("://") != -1) {
      // Just in case the access token url uses a different subdomain
      // than than the other urls involved in the oauth2 process.
      // * cough * ... gowalla
      url = this._accessTokenPath;
    }

    if (additionalParams) for (var k in additionalParams) {
      param = additionalParams[k];
      if ('function' === typeof param) {
        additionalParams[k] = // cache the fn call
          param = param.call(this, data.req, data.res);
      }
      if ('function' === typeof param) {
        param = param.call(this, data.req, data.res);
      }
      params[k] = param;
    }

    var opts = { url: url }
      , paramsVia = this._postAccessTokenParamsVia;
    switch (paramsVia) {
      case 'query': // Submit as a querystring
        opts.headers || (opts.headers = {});
        opts.headers['Content-Length'] = 0;
        paramsVia = 'qs';
        break;
      case 'data': // Submit via application/x-www-form-urlencoded
        paramsVia = 'form';
        break;
      default:
        throw new Error('postAccessTokenParamsVia must be either "query" or "data"');
    }
    opts[paramsVia] = params;
    request[this._accessTokenHttpMethod](opts, function (err, res, body) {
      if (err) {
        err.extra = {data: body, res: res};
        return p.fail(err);
      }
      if (parseInt(res.statusCode / 100) != 2) return p.fail({extra: {res: res, data: body}});
      var resType = res.headers['content-type']
        , data;
      if (resType.substring(0, 10) === 'text/plain') {
        data = querystring.parse(body);
      } else if (resType.substring(0, 33) === 'application/x-www-form-urlencoded') {
        data = querystring.parse(body);
      } else if (resType.substring(0, 16) === 'application/json') {
        data = JSON.parse(body);
      } else {
        throw new Error('Unsupported content-type ' + resType);
      }
      var aToken = data.access_token;
      delete data.access_token;
      p.fulfill(aToken, data);
    });

    return p;
  })
  .compile( function (accessToken, extra, oauthUser, user) {
    var compiled = {
        accessToken: accessToken
      , oauthUser: oauthUser
      , user: user
    };
    // extra is any extra params returned by the
    // oauth provider in response to the access token
    // POST request
    for (var k in extra) {
      // avoid clobbering any of the properties we set just above (user, accessToken, oauthUser)
      // instagram in particular sends a "user" which can break your code in strange ways if it's overwritten
      if (compiled[k]) {
        compiled.extra || (compiled.extra = {});
        compiled.extra[k] = extra[k];
      } else {
        compiled[k] = extra[k];
      }
    }
    return compiled;
  })
  .getSession( function (req) {
    return req.session;
  })
  .addToSession( function (sess, auth) {
    var _auth = sess.auth || (sess.auth = {})
      , mod = _auth[this.name] || (_auth[this.name] = {});
    _auth.loggedIn = true;
    _auth.userId || (_auth.userId = auth.user[this._userPkey]);
    mod.user = auth.oauthUser;
    mod.accessToken = auth.accessToken;
    // this._super() ?
  })
  .sendResponse( function (res, data) {
    var req = data.req;
    var continueTo = req.query['state'];

    if (continueTo) {
      return this.redirect(res, continueTo);
    }

    var redirectTo = this._redirectPath;
    if (!redirectTo)
      throw new Error('You must configure a redirectPath');
    this.redirect(res, redirectTo);
  })
  
  .authCallbackDidErr( function (req, res) {
    return false;
  });

oauth2.moreAuthQueryParams = {};
oauth2.moreAccessTokenParams = {};
oauth2.cloneOnSubmodule.push('moreAuthQueryParams', 'moreAccessTokenParams');

oauth2
  .authPath('/oauth/authorize')
  .accessTokenPath('/oauth/access_token')
  .accessTokenHttpMethod('post')
  .postAccessTokenParamsVia('query')
  .handleAuthCallbackError( function (req, res, next) {
    next(Error("You must configure handleAuthCallbackError in this module"));
  })

// Add or over-write existing query params that
// get tacked onto the oauth authorize url.
oauth2.authQueryParam = function (key, val) {
  if (arguments.length === 1 && key.constructor == Object) {
    for (var k in key) {
      this.authQueryParam(k, key[k]);
    }
    return this;
  }
  if (val)
    this.moreAuthQueryParams[key] = val;
  return this;
};

// Add or over-write existing params that
// get sent with the oauth access token request.
oauth2.accessTokenParam = function (key, val) {
  if (arguments.length === 1 && key.constructor == Object) {
    for (var k in key) {
      this.accessTokenParam(k, key[k]);
    }
    return this;
  }
  if (val)
    this.moreAccessTokenParams[key] = val;
  return this;
};

/**
 * Where to redirect to after a failed or successful OAuth authorization
 */
oauth2.redirectPath = function (path) {
  if (typeof path === 'function') {
    var self = this;
    // req here is the auth request, not the callback request
    this.authQueryParam('state', function (req, res) {
      return path.call(self, req, res);
    });
  } else {
    this._redirectPath = path;
    return this;
  }
};

// removeConfigurable
// removeStep
// undefinedSteps -> []
// How about module specific and more generic addToSession? Perhaps just do addToSession with null

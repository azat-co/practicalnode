/* OpenID for node.js
 *
 * http://ox.no/software/node-openid
 * http://github.com/havard/node-openid
 *
 * Copyright (C) 2010 by Håvard Stranden
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *
 * -*- Mode: JS; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- 
 * vim: set sw=2 ts=2 et tw=80 : 
 */

var convert = require('./lib/convert'),
    crypto = require('crypto'),
    http = require('http'),
    https = require('https'),
    querystring = require('querystring'),
    url = require('url'),
    xrds = require('./lib/xrds');

var _associations = {};
var _discoveries = {};

var openid = exports;

openid.RelyingParty = function(returnUrl, realm, stateless, strict, extensions)
{
  this.returnUrl = returnUrl;
  this.realm = realm || null;
  this.stateless = stateless;
  this.strict = strict;
  this.extensions = extensions;
}

openid.RelyingParty.prototype.authenticate = function(identifier, immediate, callback)
{
  openid.authenticate(identifier, this.returnUrl, this.realm, 
      immediate, this.stateless, callback, this.extensions, this.strict);
}

openid.RelyingParty.prototype.verifyAssertion = function(requestOrUrl, callback)
{
  openid.verifyAssertion(requestOrUrl, callback, this.stateless, this.extensions, this.strict);
}

var _isDef = function(e)
{
  var undefined;
  return e !== undefined;
}

var _toBase64 = function(binary)
{
  return convert.base64.encode(convert.btwoc(binary));
}

var _fromBase64 = function(str)
{
  return convert.unbtwoc(convert.base64.decode(str));
}

var _xor = function(a, b)
{
  if(a.length != b.length)
  {
    throw new Error('Length must match for xor');
  }

  var r = '';
  for(var i = 0; i < a.length; ++i)
  {
    r += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i));
  }

  return r;
}

openid.saveAssociation = function(provider, type, handle, secret, expiry_time_in_seconds, callback)
{
  setTimeout(function() {
    openid.removeAssociation(handle);
  }, expiry_time_in_seconds * 1000);
  _associations[handle] = {provider: provider, type : type, secret: secret};
  callback(null); // Custom implementations may report error as first argument
}

openid.loadAssociation = function(handle, callback)
{
  if(_isDef(_associations[handle]))
  {
    callback(null, _associations[handle]);
  }
  else
  {
    callback(null, null);
  }
}

openid.removeAssociation = function(handle)
{
  delete _associations[handle];
  return true;
}

openid.saveDiscoveredInformation = function(key, provider, callback)
{
  _discoveries[key] = provider;
  return callback(null);
}

openid.loadDiscoveredInformation = function(key, callback)
{
  if(!_isDef(_discoveries[key]))
  {
    return callback(null, null);
  }

  return callback(null, _discoveries[key]);
}

var _buildUrl = function(theUrl, params)
{
  theUrl = url.parse(theUrl, true);
  delete theUrl['search'];
  if(params)
  {
    if(!theUrl.query)
    {
      theUrl.query = params;
    }
    else
    {
      for(var key in params)
      {
        if(params.hasOwnProperty(key))
        {
          theUrl.query[key] = params[key];
        }
      }
    }
  }

  return url.format(theUrl);
}

var _proxyRequest = function(protocol, options)
{
  /* 
  If process.env['HTTP_PROXY_HOST'] and the env variable `HTTP_PROXY_POST`
  are set, make sure path and the header Host are set to target url.

  Similarly, `HTTPS_PROXY_HOST` and `HTTPS_PROXY_PORT` can be used
  to proxy HTTPS traffic.

  Proxies Example:
      export HTTP_PROXY_HOST=localhost
      export HTTP_PROXY_PORT=8080
      export HTTPS_PROXY_HOST=localhost
      export HTTPS_PROXY_PORT=8442

  Function returns protocol which should be used for network request, one of
  http: or https:
  */
  var targetHost = options.host;
  var newProtocol = protocol;
  if (!targetHost) return;
  var updateOptions = function (envPrefix) {
    var proxyHostname = process.env[envPrefix + '_PROXY_HOST'].trim();
    var proxyPort = parseInt(process.env[envPrefix + '_PROXY_PORT'], 10);
    if (proxyHostname.length > 0 && ! isNaN(proxyPort)) {

      if (! options.headers) options.headers = {};

      var targetHostAndPort = targetHost + ':' + options.port;

      options.host = proxyHostname;
      options.port = proxyPort;
      options.path = protocol + '//' + targetHostAndPort + options.path;
      options.headers['Host'] = targetHostAndPort;
    }
  };
  if ('https:' === protocol &&
      !! process.env['HTTPS_PROXY_HOST'] &&
      !! process.env['HTTPS_PROXY_PORT']) {
    updateOptions('HTTPS');
    // Proxy server request must be done via http... it is responsible for
    // Making the https request...    
    newProtocol = 'http:';
  } else if (!! process.env['HTTP_PROXY_HOST'] &&
             !! process.env['HTTP_PROXY_PORT']) {
    updateOptions('HTTP');
  }
  return newProtocol;
}

var _get = function(getUrl, params, callback, redirects)
{
  redirects = redirects || 5;
  getUrl = url.parse(_buildUrl(getUrl, params));

  var path = getUrl.pathname || '/';
  if(getUrl.query)
  {
    path += '?' + getUrl.query;
  }
  var options = 
  {
    host: getUrl.hostname,
    port: _isDef(getUrl.port) ? parseInt(getUrl.port, 10) :
      (getUrl.protocol == 'https:' ? 443 : 80),
    headers: { 'Accept' : 'application/xrds+xml,text/html,text/plain,*/*' },
    path: path
  };

  var protocol = _proxyRequest(getUrl.protocol, options);

  (protocol == 'https:' ? https : http).get(options, function(res)
  {
    var data = '';
    res.on('data', function(chunk)
    {
      data += chunk;
    });

    var isDone = false;
    var done = function()
    {
      if (isDone) return;
      isDone = true;

      if(res.headers.location && --redirects)
      {
        var redirectUrl = res.headers.location;
        if(redirectUrl.indexOf('http') !== 0)
        {
          redirectUrl = getUrl.protocol + '//' + getUrl.hostname + ':' + options.port + (redirectUrl.indexOf('/') === 0 ? redirectUrl : '/' + redirectUrl);
        }
        _get(redirectUrl, params, callback, redirects);
      }
      else
      {
        callback(data, res.headers, res.statusCode);
      }
    }

    res.on('end', function() { done(); });
    res.on('close', function() { done(); });
  }).on('error', function(error) 
  {
    return callback(error);
  });
}

var _post = function(postUrl, data, callback, redirects)
{
  redirects = redirects || 5;
  postUrl = url.parse(postUrl);

  var path = postUrl.pathname || '/';
  if(postUrl.query)
  {
    path += '?' + postUrl.query;
  }

  var encodedData = _encodePostData(data);
  var options = 
  {
    host: postUrl.hostname,
    path: path,
    port: _isDef(postUrl.port) ? postUrl.port :
      (postUrl.protocol == 'https:' ? 443 : 80),
    headers: 
    {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': encodedData.length
    },
    method: 'POST'
  };

  var protocol = _proxyRequest(postUrl.protocol, options);

  (protocol == 'https:' ? https : http).request(options, function(res)
  {
    var data = '';
    res.on('data', function(chunk)
    {
      data += chunk;
    });

    var isDone = false;
    var done = function()
    {
      if (isDone) return;
      isDone = true;

      if(res.headers.location && --redirects)
      {
        _post(res.headers.location, data, callback, redirects);
      }
      else
      {
        callback(data, res.headers, res.statusCode);
      }
    }

    res.on('end', function() { done(); });
    res.on('close', function() { done(); });
  }).on('error', function(error)
  {
    return callback(error);
  }).end(encodedData);
}

var _encodePostData = function(data)
{
  var encoded = querystring.stringify(data);
  return encoded;
}

var _decodePostData = function(data)
{
  var lines = data.split('\n');
  var result = {};
  for (var i = 0; i < lines.length ; i++) {
    var line = lines[i];
    if (line.length > 0 && line[line.length - 1] == '\r') {
      line = line.substring(0, line.length - 1);
    }
    var colon = line.indexOf(':');
    if (colon === -1)
    {
      continue;
    }
    var key = line.substr(0, line.indexOf(':'));
    var value = line.substr(line.indexOf(':') + 1);
    result[key] = value;
  }

  return result;
}

var _normalizeIdentifier = function(identifier)
{
  identifier = identifier.replace(/^\s+|\s+$/g, '');
  if(!identifier)
    return null;
  if(identifier.indexOf('xri://') === 0)
  {
    identifier = identifier.substring(6);
  }

  if(/^[(=@\+\$!]/.test(identifier))
  {
    return identifier;
  }

  if(identifier.indexOf('http') === 0)
  {
    return identifier;
  }
  return 'http://' + identifier;
}

var _parseXrds = function(xrdsUrl, xrdsData)
{
  var services = xrds.parse(xrdsData);
  if(services == null)
  {
    return null;
  }

  var providers = [];
  for(var i = 0, len = services.length; i < len; ++i)
  {
    var service = services[i];
    var provider = {};

    provider.endpoint = service.uri;
    if(/https?:\/\/xri./.test(xrdsUrl))
    {
      provider.claimedIdentifier = service.id;
    }
    if(service.type == 'http://specs.openid.net/auth/2.0/signon')
    {
      provider.version = 'http://specs.openid.net/auth/2.0';
      provider.localIdentifier = service.id;
    }
    else if(service.type == 'http://specs.openid.net/auth/2.0/server')
    {
      provider.version = 'http://specs.openid.net/auth/2.0';
    }
    else if(service.type == 'http://openid.net/signon/1.0' || 
      service.type == 'http://openid.net/signon/1.1')
    {
      provider.version = service.type;
      provider.localIdentifier = service.delegate;
    }
    else
    {
      continue;
    }
    providers.push(provider);
  }

  return providers;
}

var _matchMetaTag = function(html)
{
  var metaTagMatches = /<meta\s+.*?http-equiv="x-xrds-location"\s+(.*?)>/ig.exec(html);
  if(!metaTagMatches || metaTagMatches.length < 2)
  {
    return null;
  }

  var contentMatches = /content="(.*?)"/ig.exec(metaTagMatches[1]);
  if(!contentMatches || contentMatches.length < 2)
  {
    return null;
  }

  return contentMatches[1];
}

var _matchLinkTag = function(html, rel)
{
  var providerLinkMatches = new RegExp('<link\\s+.*?rel=["\'][^"\']*?' + rel + '[^"\']*?["\'].*?>', 'ig').exec(html);

  if(!providerLinkMatches || providerLinkMatches.length < 1)
  {
    return null;
  }

  var href = /href=["'](.*?)["']/ig.exec(providerLinkMatches[0]);

  if(!href || href.length < 2)
  {
    return null;
  }
  return href[1];
}

var _parseHtml = function(htmlUrl, html, callback, hops)
{
  var metaUrl = _matchMetaTag(html);
  if(metaUrl != null)
  {
    return _resolveXri(metaUrl, callback, hops + 1);
  }

  var provider = _matchLinkTag(html, 'openid2.provider');
  if(provider == null)
  {
    provider = _matchLinkTag(html, 'openid.server');
    if(provider == null)
    {
      callback(null);
    }
    else
    {
      var localId = _matchLinkTag(html, 'openid.delegate');
      callback([{ 
        version: 'http://openid.net/signon/1.1',
        endpoint: provider, 
        claimedIdentifier: htmlUrl,
        localIdentifier : localId 
      }]);
    }
  }
  else
  {
    var localId = _matchLinkTag(html, 'openid2.local_id');
    callback([{ 
      version: 'http://specs.openid.net/auth/2.0/signon', 
      endpoint: provider, 
      claimedIdentifier: htmlUrl,
      localIdentifier : localId 
    }]);
  }
}

var _parseHostMeta = function(hostMeta, callback)
{
  var match = /^Link: <([^\n\r]+)>;/.exec(hostMeta);
  if(match != null)
  {
    var xriUrl = match[0].slice(7,match.length - 4);
    _resolveXri(xriUrl, callback);
  }
  else
  {
    callback(null)
  }
}

var _resolveXri = function(xriUrl, callback, hops)
{
  if(!hops)
  {
    hops = 1;
  }
  else if(hops >= 5)
  {
    return callback(null);
  }

  _get(xriUrl, null, function(data, headers, statusCode)
  {
    if(statusCode != 200)
    {
      return callback(null);
    }

    var xrdsLocation = headers['x-xrds-location'];
    if(_isDef(xrdsLocation))
    {
      _get(xrdsLocation, null, function(data, headers, statusCode)
      {
        if(statusCode != 200 || data == null)
        {
          callback(null);
        }
        else
        {
          callback(_parseXrds(xrdsLocation, data));
        }
      });
    }
    else if(data != null)
    {
      var contentType = headers['content-type'];
      // text/xml is not compliant, but some hosting providers refuse header
      // changes, so text/xml is encountered
      if(contentType.indexOf('application/xrds+xml') === 0 || contentType.indexOf('text/xml') === 0)
      {
        return callback(_parseXrds(xriUrl, data));
      }
      else
      {
        return _resolveHtml(xriUrl, callback, hops + 1, data);
      }
    }
  });
}

var _resolveHtml = function(identifier, callback, hops, data)
{
  if(!hops)
  {
    hops = 1;
  }
  else if(hops >= 5)
  {
    return callback(null);
  }

  if(data == null)
  {
    _get(identifier, null, function(data, headers, statusCode)
    {
      if(statusCode != 200 || data == null)
      {
        callback(null);
      }
      else
      {
        _parseHtml(identifier, data, callback, hops + 1);
      }
    });
  }
  else
  {
    _parseHtml(identifier, data, callback, hops);
  }

}

var _resolveHostMeta = function(identifier, strict, callback, fallBackToProxy)
{
  var host = url.parse(identifier);
  var hostMetaUrl;
  if(fallBackToProxy && !strict)
  {
    hostMetaUrl = 'https://www.google.com/accounts/o8/.well-known/host-meta?hd=' + host.host
  }
  else
  {
    hostMetaUrl = host.protocol + '//' + host.host + '/.well-known/host-meta';
  }
  if(!hostMetaUrl)
  {
    callback(null);
  }
  else
  {
    _get(hostMetaUrl, null, function(data, headers, statusCode)
    {
      if(statusCode != 200 || data == null)
      {
        if(!fallBackToProxy && !strict){
          _resolveHostMeta(identifier, strict, callback, true);
        }
        else{
          callback(null);
        }
      }
      else
      {
        //Attempt to parse the data but if this fails it may be because
        //the response to hostMetaUrl was some other http/html resource.
        //Therefore fallback to the proxy if no providers are found.
        _parseHostMeta(data, function(providers){
          if((providers == null || providers.length == 0) && !fallBackToProxy && !strict){
            _resolveHostMeta(identifier, strict, callback, true);
          }
          else{
            callback(providers);
          }
        });
      }
    });
  }
}

openid.discover = function(identifier, strict, callback)
{
  identifier = _normalizeIdentifier(identifier);
  if(!identifier) 
  {
    return callback({ message: 'Invalid identifier' }, null);
  }
  if(identifier.indexOf('http') !== 0)
  {
    // XRDS
    identifier = 'https://xri.net/' + identifier + '?_xrd_r=application/xrds%2Bxml';
  }

  // Try XRDS/Yadis discovery
  _resolveXri(identifier, function(providers)
  {
    if(providers == null || providers.length == 0)
    {
      // Fallback to HTML discovery
      _resolveHtml(identifier, function(providers)
      {
        if(providers == null || providers.length == 0){
          _resolveHostMeta(identifier, strict, function(providers){
            callback(null, providers);
          });
        }
        else{
          callback(null, providers);
        }
      });
    }
    else
    {
      // Add claimed identifier to providers with local identifiers
      // and OpenID 1.0/1.1 providers to ensure correct resolution 
      // of identities and services
      for(var i = 0, len = providers.length; i < len; ++i)
      {
        var provider = providers[i];
        if(!provider.claimedIdentifier && 
          (provider.localIdentifier || provider.version.indexOf('2.0') === -1))
        {
          provider.claimedIdentifier = identifier;
        }
      }
      callback(null, providers);
    }
  });
}

var _createDiffieHellmanKeyExchange = function(algorithm)
{
  var defaultPrime = 'ANz5OguIOXLsDhmYmsWizjEOHTdxfo2Vcbt2I3MYZuYe91ouJ4mLBX+YkcLiemOcPym2CBRYHNOyyjmG0mg3BVd9RcLn5S3IHHoXGHblzqdLFEi/368Ygo79JRnxTkXjgmY0rxlJ5bU1zIKaSDuKdiI+XUkKJX8Fvf8W8vsixYOr';

  var dh = crypto.createDiffieHellman(defaultPrime, 'base64');

  dh.generateKeys();

  return dh;
}

openid.associate = function(provider, callback, strict, algorithm)
{
  var params = _generateAssociationRequestParameters(provider.version, algorithm);
  if(!_isDef(algorithm))
  {
    algorithm = 'DH-SHA256';
  }

  var dh = null;
  if(algorithm.indexOf('no-encryption') === -1)
  {
    dh = _createDiffieHellmanKeyExchange(algorithm);
    params['openid.dh_modulus'] = _toBase64(dh.getPrime('binary'));
    params['openid.dh_gen'] = _toBase64(dh.getGenerator('binary'));
    params['openid.dh_consumer_public'] = _toBase64(dh.getPublicKey('binary'));
  }

  _post(provider.endpoint, params, function(data, headers, statusCode)
  {
    if ((statusCode != 200 && statusCode != 400) || data === null)
    {
      return callback({ 
        message: 'HTTP request failed' 
      }, { 
        error: 'HTTP request failed', 
        error_code: ''  + statusCode, 
        ns: 'http://specs.openid.net/auth/2.0' 
      });
    }
    
    data = _decodePostData(data);

    if(data.error_code == 'unsupported-type' || !_isDef(data.ns))
    {
      if(algorithm == 'DH-SHA1')
      {
        if(strict && url.protocol != 'https:')
        {
          return callback({ message: 'Channel is insecure and no encryption method is supported by provider' }, null);
        }
        else
        {
          return openid.associate(provider, callback, strict, 'no-encryption-256');
        }
      }
      else if(algorithm == 'no-encryption-256')
      {
        if(strict && url.protocol != 'https:')
        {
          return callback('Channel is insecure and no encryption method is supported by provider', null);
        }
        /*else if(provider.version.indexOf('2.0') === -1)
        {
          // 2011-07-22: This is an OpenID 1.0/1.1 provider which means
          // HMAC-SHA1 has already been attempted with a blank session
          // type as per the OpenID 1.0/1.1 specification.
          // (See http://openid.net/specs/openid-authentication-1_1.html#mode_associate)
          // However, providers like wordpress.com don't follow the 
          // standard and reject these requests, but accept OpenID 2.0
          // style requests without a session type, so we have to give
          // those a shot as well.
          callback({ message: 'Provider is OpenID 1.0/1.1 and does not support OpenID 1.0/1.1 association.' });
        }*/
        else
        {
          return openid.associate(provider, callback, strict, 'no-encryption');
        }
      }
      else if(algorithm == 'DH-SHA256')
      {
        return openid.associate(provider, callback, strict, 'DH-SHA1');
      }
    }

    if (data.error)
    {
      callback({ message: data.error }, data);
    }
    else
    {
      var secret = null;

      var hashAlgorithm = algorithm.indexOf('256') !== -1 ? 'sha256' : 'sha1';

      if(algorithm.indexOf('no-encryption') !== -1)
      {
        secret = data.mac_key;
      }
      else
      {
        var serverPublic = _fromBase64(data.dh_server_public);
        var sharedSecret = convert.btwoc(dh.computeSecret(serverPublic, 'binary', 'binary'));
        var hash = crypto.createHash(hashAlgorithm);
        hash.update(sharedSecret);
        sharedSecret = hash.digest('binary');
        var encMacKey = convert.base64.decode(data.enc_mac_key);
        secret = convert.base64.encode(_xor(encMacKey, sharedSecret));
      }

      if (!_isDef(data.assoc_handle)) {
        return callback({ message: 'OpenID provider does not seem to support association; you need to use stateless mode'}, null);
      }

      openid.saveAssociation(provider, hashAlgorithm,
        data.assoc_handle, secret, data.expires_in * 1, function(error)
        {
          if(error)
          {
            return callback(error);
          }
          callback(null, data);
        });
    }
  });
}

var _generateAssociationRequestParameters = function(version, algorithm)
{
  var params = {
    'openid.mode' : 'associate',
  };

  if(version.indexOf('2.0') !== -1)
  {
    params['openid.ns'] = 'http://specs.openid.net/auth/2.0';
  }

  if(algorithm == 'DH-SHA1')
  {
    params['openid.assoc_type'] = 'HMAC-SHA1';
    params['openid.session_type'] = 'DH-SHA1';
  }
  else if(algorithm == 'no-encryption-256')
  {
    if(version.indexOf('2.0') === -1)
    {
      params['openid.session_type'] = ''; // OpenID 1.0/1.1 requires blank
      params['openid.assoc_type'] = 'HMAC-SHA1';
    }
    else
    {
      params['openid.session_type'] = 'no-encryption';
      params['openid.assoc_type'] = 'HMAC-SHA256';
    }
  }
  else if(algorithm == 'no-encryption')
  {
    if(version.indexOf('2.0') !== -1)
    {
      params['openid.session_type'] = 'no-encryption';
    }
    params['openid.assoc_type'] = 'HMAC-SHA1';
  }
  else
  {
    params['openid.assoc_type'] = 'HMAC-SHA256';
    params['openid.session_type'] = 'DH-SHA256';
  }

  return params;
}

openid.authenticate = function(identifier, returnUrl, realm, immediate, stateless, callback, extensions, strict)
{
  openid.discover(identifier, strict, function(error, providers)
  {
    if(error)
    {
      return callback(error);
    }
    if(!providers || providers.length === 0)
    {
      return callback({ message: 'No providers found for the given identifier' }, null);
    }

    var providerIndex = -1;

    var chooseProvider = function successOrNext(error, authUrl)
    {
      if(!error && authUrl)
      {
        var provider = providers[providerIndex];

        if(provider.claimedIdentifier)
        {
          var useLocalIdentifierAsKey = provider.version.indexOf('2.0') === -1 && provider.localIdentifier && provider.claimedIdentifier != provider.localIdentifier;

          return openid.saveDiscoveredInformation(useLocalIdentifierAsKey ? provider.localIdentifier : provider.claimedIdentifier, 
            provider, function(error)
          {
            if(error)
            {
              return callback(error);
            }
            return callback(null, authUrl);
          });
        }
        else if(provider.version.indexOf('2.0') !== -1)
        {
          return callback(null, authUrl);
        }
        else {
          successOrNext({ message: 'OpenID 1.0/1.1 provider cannot be used without a claimed identifier' });
        }
      }
      if(++providerIndex >= providers.length)
      {
        return callback({ message: 'No usable providers found for the given identifier' }, null);
      }

      var currentProvider = providers[providerIndex];
      if(stateless)
      {
        _requestAuthentication(currentProvider, null, returnUrl, 
          realm, immediate, extensions || {}, successOrNext);
      }

      else
      {
        openid.associate(currentProvider, function(error, answer)
        {
          if(error || !answer || answer.error)
          {
            successOrNext(error || answer.error, null);
          }
          else
          {
            _requestAuthentication(currentProvider, answer.assoc_handle, returnUrl, 
              realm, immediate, extensions || {}, successOrNext);
          }
        });
        
      }
    };

    chooseProvider();
  });
}

var _requestAuthentication = function(provider, assoc_handle, returnUrl, realm, immediate, extensions, callback)
{
  var params = {
    'openid.mode' : immediate ? 'checkid_immediate' : 'checkid_setup'
  };

  if(provider.version.indexOf('2.0') !== -1)
  {
    params['openid.ns'] = 'http://specs.openid.net/auth/2.0';
  }

  for (var i in extensions)
  {
    if(!extensions.hasOwnProperty(i))
    {
      continue;
    }

    var extension = extensions[i];
    for (var key in extension.requestParams)
    {
      if (!extension.requestParams.hasOwnProperty(key)) { continue; }
      params[key] = extension.requestParams[key];
    }
  }

  if(provider.claimedIdentifier)
  {
    params['openid.claimed_id'] = provider.claimedIdentifier;
    if(provider.localIdentifier)
    {
      params['openid.identity'] = provider.localIdentifier;
    }
    else
    {
      params['openid.identity'] = provider.claimedIdentifier;
    }
  }
  else if(provider.version.indexOf('2.0') !== -1)
  {
    params['openid.claimed_id'] = params['openid.identity'] =
      'http://specs.openid.net/auth/2.0/identifier_select';
  }
  else {
    return callback({ message: 'OpenID 1.0/1.1 provider cannot be used without a claimed identifier' });
  }

  if(assoc_handle)
  {
    params['openid.assoc_handle'] = assoc_handle;
  }

  if(returnUrl)
  {
    // Value should be missing if RP does not want
    // user to be sent back
    params['openid.return_to'] = returnUrl;
  }

  if(realm)
  {
    if(provider.version.indexOf('2.0') !== -1) {
      params['openid.realm'] = realm;
    }
    else {
      params['openid.trust_root'] = realm;
    }
  }
  else if(!returnUrl)
  {
    return callback({ message: 'No return URL or realm specified' });
  }

  callback(null, _buildUrl(provider.endpoint, params));
}

openid.verifyAssertion = function(requestOrUrl, callback, stateless, extensions, strict)
{
  extensions = extensions || {};
  var assertionUrl = requestOrUrl;
  if(typeof(requestOrUrl) !== typeof(''))
  {
    if(requestOrUrl.method == 'POST') {
      if(requestOrUrl.headers['content-type'] == 'application/x-www-form-urlencoded') {
        // POST response received
        var data = '';
        
        requestOrUrl.on('data', function(chunk) {
          data += chunk;
        });
        
        requestOrUrl.on('end', function() {
          var params = querystring.parse(data);
          return _verifyAssertionData(params, callback, stateless, extensions, strict);
        });
      }
      else {
        return callback({ message: 'Invalid POST response from OpenID provider' });
      }
      
      return; // Avoid falling through to GET method assertion
    }
    else if(requestOrUrl.method != 'GET') {
      return callback({ message: 'Invalid request method from OpenID provider' });
    }
    assertionUrl = requestOrUrl.url;
  }

  assertionUrl = url.parse(assertionUrl, true);
  var params = assertionUrl.query;

  return _verifyAssertionData(params, callback, stateless, extensions, strict);
}

var _verifyAssertionData = function(params, callback, stateless, extensions, strict) {
  var assertionError = _getAssertionError(params);
  if(assertionError)
  {
    return callback({ message: assertionError }, { authenticated: false });
  }

  if (!_invalidateAssociationHandleIfRequested(params)) {
    return callback({ message: 'Unable to invalidate association handle'});
  }

  // TODO: Check nonce if OpenID 2.0
  _verifyDiscoveredInformation(params, stateless, extensions, strict, function(error, result)
  {
    return callback(error, result);
  });
};

var _getAssertionError = function(params)
{
  if(!_isDef(params))
  {
    return 'Assertion request is malformed';
  }
  else if(params['openid.mode'] == 'error')
  {
    return params['openid.error'];
  }
  else if(params['openid.mode'] == 'cancel')
  {
    return 'Authentication cancelled';
  }

  return null;
}

var _invalidateAssociationHandleIfRequested = function(params)
{
  if (params['is_valid'] == 'true' && _isDef(params['openid.invalidate_handle'])) {
    if(!openid.removeAssociation(params['openid.invalidate_handle'])) {
      return false;
    }
  }

  return true;
}

var _verifyDiscoveredInformation = function(params, stateless, extensions, strict, callback)
{
  var claimedIdentifier = params['openid.claimed_id'];
  var useLocalIdentifierAsKey = false;
  if(!_isDef(claimedIdentifier))
  {
    if(!_isDef(params['openid.ns']))
    {
      // OpenID 1.0/1.1 response without a claimed identifier
      // We need to load discovered information using the
      // local identifier
      useLocalIdentifierAsKey = true;
    }
    else {
      // OpenID 2.0+:
      // If there is no claimed identifier, then the
      // assertion is not about an identity
      return callback(null, { authenticated: false }); 
      }
  }

  if (useLocalIdentifierAsKey) {
    claimedIdentifier = params['openid.identity'];  
  }

  claimedIdentifier = _getCanonicalClaimedIdentifier(claimedIdentifier);
  openid.loadDiscoveredInformation(claimedIdentifier, function(error, provider)
  {
    if(error)
    {
      return callback({ message: 'An error occured when loading previously discovered information about the claimed identifier' });
    }

    if(provider)
    {
      return _verifyAssertionAgainstProviders([provider], params, stateless, extensions, callback);
    }
    else if (useLocalIdentifierAsKey) {
      return callback({ message: 'OpenID 1.0/1.1 response received, but no information has been discovered about the provider. It is likely that this is a fraudulent authentication response.' });
    }
    
    openid.discover(claimedIdentifier, strict, function(error, providers)
    {
      if(error)
      {
        return callback(error);
      }
      if(!providers || !providers.length)
      {
        return callback({ message: 'No OpenID provider was discovered for the asserted claimed identifier' });
      }

      _verifyAssertionAgainstProviders(providers, params, stateless, extensions, callback);
    });
  });
}

var _verifyAssertionAgainstProviders = function(providers, params, stateless, extensions, callback)
{
  for(var i = 0; i < providers.length; ++i)
  {
    var provider = providers[i];
    if(!provider.version || provider.version.indexOf(params['openid.ns']) !== 0)
    {
      continue;
    }

    if(provider.version.indexOf('2.0') !== -1)
    {
      var endpoint = params['openid.op_endpoint'];
      if (provider.endpoint != endpoint) 
      {
        continue;
      }
      if(provider.claimedIdentifier) {
        var claimedIdentifier = _getCanonicalClaimedIdentifier(params['openid.claimed_id']);
        if(provider.claimedIdentifier != claimedIdentifier) {
          return callback({ message: 'Claimed identifier in assertion response does not match discovered claimed identifier' });
        }
      }
    }

    if(provider.localIdentifier && provider.localIdentifier != params['openid.identity'])
    {
      return callback({ message: 'Identity in assertion response does not match discovered local identifier' });
    }

    return _checkSignature(params, provider, stateless, function(error, result)
    {
      if(error)
      {
        return callback(error);
      }
      if(extensions && result.authenticated)
      {
        for(var ext in extensions)
        {
          if (!extensions.hasOwnProperty(ext))
          { 
            continue; 
          }
          var instance = extensions[ext];
          instance.fillResult(params, result);
        }
      }

      return callback(null, result);
    });
  }

  callback({ message: 'No valid providers were discovered for the asserted claimed identifier' });
}

var _checkSignature = function(params, provider, stateless, callback)
{
  if(!_isDef(params['openid.signed']) ||
    !_isDef(params['openid.sig']))
  {
    return callback({ message: 'No signature in response' }, { authenticated: false });
  }

  if(stateless)
  {
    _checkSignatureUsingProvider(params, provider, callback);
  }
  else
  {
    _checkSignatureUsingAssociation(params, callback);
  }
}

var _checkSignatureUsingAssociation = function(params, callback)
{
  if (!_isDef(params['openid.assoc_handle']))
  {
    return callback({ message: 'No association handle in provider response. Find out whether the provider supports associations and/or use stateless mode.' });
  }
  openid.loadAssociation(params['openid.assoc_handle'], function(error, association)
  {
    if(error)
    {
      return callback({ message: 'Error loading association' }, { authenticated: false });
    }
    if(!association)
    {
      return callback({ message:'Invalid association handle' }, { authenticated: false });
    }
    if(association.provider.version.indexOf('2.0') !== -1 && association.provider.endpoint !== params['openid.op_endpoint'])
    {
      return callback({ message:'Association handle does not match provided endpoint' }, {authenticated: false});
    }
    
    var message = '';
    var signedParams = params['openid.signed'].split(',');
    for(var i = 0; i < signedParams.length; i++)
    {
      var param = signedParams[i];
      var value = params['openid.' + param];
      if(!_isDef(value))
      {
        return callback({ message: 'At least one parameter referred in signature is not present in response' }, { authenticated: false });
      }
      message += param + ':' + value + '\n';
    }

    var hmac = crypto.createHmac(association.type, convert.base64.decode(association.secret));
    hmac.update(message, 'utf8');
    var ourSignature = hmac.digest('base64');

    if(ourSignature == params['openid.sig'])
    {
      callback(null, { authenticated: true, claimedIdentifier: association.provider.version.indexOf('2.0') !== -1 ? params['openid.claimed_id'] : association.provider.claimedIdentifier });
    }
    else
    {
      callback({ message: 'Invalid signature' }, { authenticated: false });
    }
  });
}

var _checkSignatureUsingProvider = function(params, provider, callback)
{
  var requestParams = 
  {
    'openid.mode' : 'check_authentication'
  };
  for(var key in params)
  {
    if(params.hasOwnProperty(key) && key != 'openid.mode')
    {
      requestParams[key] = params[key];
    }
  }

  _post(_isDef(params['openid.ns']) ? (params['openid.op_endpoint'] || provider.endpoint) : provider.endpoint, requestParams, function(data, headers, statusCode)
  {
    if(statusCode != 200 || data == null)
    {
      return callback({ message: 'Invalid assertion response from provider' }, { authenticated: false });
    }
    else
    {
      data = _decodePostData(data);
      if(data['is_valid'] == 'true')
      {
        return callback(null, { authenticated: true, claimedIdentifier: provider.version.indexOf('2.0') !== -1 ? params['openid.claimed_id'] : params['openid.identity'] });
      }
      else
      {
        return callback({ message: 'Invalid signature' }, { authenticated: false });
      }
    }
  });

}


var _getCanonicalClaimedIdentifier = function(claimedIdentifier) {
  if(!claimedIdentifier) {
    return claimedIdentifier;
  }

  var index = claimedIdentifier.indexOf('#');
  if (index !== -1) {
    return claimedIdentifier.substring(0, index);
  }

  return claimedIdentifier;
};

/* ==================================================================
 * Extensions
 * ================================================================== 
 */

var _getExtensionAlias = function(params, ns) 
{
  for (var k in params)
    if (params[k] == ns)
      return k.replace("openid.ns.", "");
}

/* 
 * Simple Registration Extension
 * http://openid.net/specs/openid-simple-registration-extension-1_1-01.html
 */

var sreg_keys = ['nickname', 'email', 'fullname', 'dob', 'gender', 'postcode', 'country', 'language', 'timezone'];

openid.SimpleRegistration = function SimpleRegistration(options) 
{
  this.requestParams = {'openid.ns.sreg': 'http://openid.net/extensions/sreg/1.1'};
  if (options.policy_url)
    this.requestParams['openid.sreg.policy_url'] = options.policy_url;
  var required = [];
  var optional = [];
  for (var i = 0; i < sreg_keys.length; i++)
  {
    var key = sreg_keys[i];
    if (options[key]) 
    {
      if (options[key] == 'required')
      {
        required.push(key);
      }
      else
      {
        optional.push(key);
      }
    }
    if (required.length)
    {
      this.requestParams['openid.sreg.required'] = required.join(',');
    }
    if (optional.length)
    {
      this.requestParams['openid.sreg.optional'] = optional.join(',');
    }
  }
};

openid.SimpleRegistration.prototype.fillResult = function(params, result)
{
  var extension = _getExtensionAlias(params, 'http://openid.net/extensions/sreg/1.1') || 'sreg';
  for (var i = 0; i < sreg_keys.length; i++)
  {
    var key = sreg_keys[i];
    if (params['openid.' + extension + '.' + key])
    {
      result[key] = params['openid.' + extension + '.' + key];
    }
  }
};

/* 
 * User Interface Extension
 * http://svn.openid.net/repos/specifications/user_interface/1.0/trunk/openid-user-interface-extension-1_0.html 
 */
openid.UserInterface = function UserInterface(options) 
{
  if (typeof(options) != 'object')
  {
    options = { mode: options || 'popup' };
  }

  this.requestParams = {'openid.ns.ui': 'http://specs.openid.net/extensions/ui/1.0'};
  for (var k in options) 
  {
    this.requestParams['openid.ui.' + k] = options[k];
  }
};

openid.UserInterface.prototype.fillResult = function(params, result)
{
  // TODO: Fill results
}

/* 
 * Attribute Exchange Extension
 * http://openid.net/specs/openid-attribute-exchange-1_0.html 
 * Also see:
 *  - http://www.axschema.org/types/ 
 *  - http://code.google.com/intl/en-US/apis/accounts/docs/OpenID.html#Parameters
 */
// TODO: count handling

var attributeMapping = 
{
    'http://axschema.org/contact/country/home': 'country'
  , 'http://axschema.org/contact/email': 'email'
  , 'http://axschema.org/namePerson/first': 'firstname'
  , 'http://axschema.org/pref/language': 'language'
  , 'http://axschema.org/namePerson/last': 'lastname'
  // The following are not in the Google document:
  , 'http://axschema.org/namePerson/friendly': 'nickname'
  , 'http://axschema.org/namePerson': 'fullname'
};

openid.AttributeExchange = function AttributeExchange(options) 
{ 
  this.requestParams = {'openid.ns.ax': 'http://openid.net/srv/ax/1.0',
    'openid.ax.mode' : 'fetch_request'};
  var required = [];
  var optional = [];
  for (var ns in options)
  {
    if (!options.hasOwnProperty(ns)) { continue; }
    if (options[ns] == 'required')
    {
      required.push(ns);
    }
    else
    {
      optional.push(ns);
    }
  }
  var self = this;
  required = required.map(function(ns, i) 
  {
    var attr = attributeMapping[ns] || 'req' + i;
    self.requestParams['openid.ax.type.' + attr] = ns;
    return attr;
  });
  optional = optional.map(function(ns, i)
  {
    var attr = attributeMapping[ns] || 'opt' + i;
    self.requestParams['openid.ax.type.' + attr] = ns;
    return attr;
  });
  if (required.length)
  {
    this.requestParams['openid.ax.required'] = required.join(',');
  }
  if (optional.length)
  {
    this.requestParams['openid.ax.if_available'] = optional.join(',');
  }
}

openid.AttributeExchange.prototype.fillResult = function(params, result)
{
  var extension = _getExtensionAlias(params, 'http://openid.net/srv/ax/1.0') || 'ax';
  var regex = new RegExp('^openid\\.' + extension + '\\.(value|type)\\.(\\w+)$');
  var aliases = {};
  var values = {};
  for (var k in params)
  {
    if (!params.hasOwnProperty(k)) { continue; }
    var matches = k.match(regex);
    if (!matches)
    {
      continue;
    }
    if (matches[1] == 'type')
    {
      aliases[params[k]] = matches[2];
    }
    else
    {
      values[matches[2]] = params[k];
    }
  }
  for (var ns in aliases) 
  {
    if (aliases[ns] in values)
    {
      result[aliases[ns]] = values[aliases[ns]];
      result[ns] = values[aliases[ns]];
    }
  }
}

openid.OAuthHybrid = function(options)
{
  this.requestParams = {
    'openid.ns.oauth'       : 'http://specs.openid.net/extensions/oauth/1.0',
    'openid.oauth.consumer' : options['consumerKey'],
    'openid.oauth.scope'    : options['scope']};
}

openid.OAuthHybrid.prototype.fillResult = function(params, result)
{
  var extension = _getExtensionAlias(params, 'http://specs.openid.net/extensions/oauth/1.0') || 'oauth'
    , token_attr = 'openid.' + extension + '.request_token';
  
  
  if(params[token_attr] !== undefined)
  {
    result['request_token'] = params[token_attr];
  }
};

/* 
 * Provider Authentication Policy Extension (PAPE)
 * http://openid.net/specs/openid-provider-authentication-policy-extension-1_0.html
 * 
 * Note that this extension does not validate that the provider is obeying the
 * authentication request, it only allows the request to be made.
 *
 * TODO: verify requested 'max_auth_age' against response 'auth_time'
 * TODO: verify requested 'auth_level.ns.<cust>' (etc) against response 'auth_level.ns.<cust>'
 * TODO: verify requested 'preferred_auth_policies' against response 'auth_policies'
 *
 */

/* Just the keys that aren't open to customisation */
var pape_request_keys = ['max_auth_age', 'preferred_auth_policies', 'preferred_auth_level_types' ];
var pape_response_keys = ['auth_policies', 'auth_time']

/* Some short-hand mappings for auth_policies */ 
var papePolicyNameMap = 
{
    'phishing-resistant': 'http://schemas.openid.net/pape/policies/2007/06/phishing-resistant',
    'multi-factor': 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
    'multi-factor-physical': 'http://schemas.openid.net/pape/policies/2007/06/multi-factor-physical',
    'none' : 'http://schemas.openid.net/pape/policies/2007/06/none'
}
 
openid.PAPE = function PAPE(options) 
{
  this.requestParams = {'openid.ns.pape': 'http://specs.openid.net/extensions/pape/1.0'};
  for (var k in options) 
  {
    if (k === 'preferred_auth_policies') {
      this.requestParams['openid.pape.' + k] = _getLongPolicyName(options[k]);
    } else {
      this.requestParams['openid.pape.' + k] = options[k];
    }
  }
  var util = require('util');
};

/* you can express multiple pape 'preferred_auth_policies', so replace each
 * with the full policy URI as per papePolicyNameMapping. 
 */
var _getLongPolicyName = function(policyNames) {
  var policies = policyNames.split(' ');   
  for (var i=0; i<policies.length; i++) {
    if (policies[i] in papePolicyNameMap) {
      policies[i] = papePolicyNameMap[policies[i]];
    }
  }
  return policies.join(' ');
}

var _getShortPolicyName = function(policyNames) {
  var policies = policyNames.split(' ');   
  for (var i=0; i<policies.length; i++) {
    for (shortName in papePolicyNameMap) {
      if (papePolicyNameMap[shortName] === policies[i]) {
        policies[i] = shortName;
      }
    }
  }
  return policies.join(' ');
}

openid.PAPE.prototype.fillResult = function(params, result)
{
  var extension = _getExtensionAlias(params, 'http://specs.openid.net/extensions/pape/1.0') || 'pape';
  var paramString = 'openid.' + extension + '.';
  var thisParam;
  for (var p in params) {
    if (params.hasOwnProperty(p)) {
      if (p.substr(0, paramString.length) === paramString) {
        thisParam = p.substr(paramString.length);
        if (thisParam === 'auth_policies') {
          result[thisParam] = _getShortPolicyName(params[p]);
        } else {
          result[thisParam] = params[p];
        }
      }
    }
  } 
}

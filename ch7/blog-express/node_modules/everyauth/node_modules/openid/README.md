# OpenID for Node.js

OpenID for Node.js is (yes, you guessed it) an OpenID implementation for Node.js. 

Highlights and features include:

- Full OpenID 1.0/1.1/2.0 compliant Relying Party (client) implementation
- Very simple API
- Simple extension points for association state

## Download

The library can be [reviewed and retrieved from GitHub](http://github.com/havard/node-openid).

## Installation

If you use [`npm`](http://npmjs.org), simply do `npm install openid`.

Otherwise, you can grab the code from [GitHub](https://github.com/havard/node-openid).

## Examples

Here's a very simple server using OpenID for Node.js for authentication:

```javascript
var openid = require('openid');
var url = require('url');
var querystring = require('querystring');
var relyingParty = new openid.RelyingParty(
    'http://example.com/verify', // Verification URL (yours)
    null, // Realm (optional, specifies realm for OpenID authentication)
    false, // Use stateless verification
    false, // Strict mode
    []); // List of extensions to enable and include


var server = require('http').createServer(
    function(req, res)
    {
        var parsedUrl = url.parse(req.url);
        if(parsedUrl.pathname == '/authenticate')
        { 
          // User supplied identifier
          var query = querystring.parse(parsedUrl.query);
          var identifier = query.openid_identifier;

          // Resolve identifier, associate, and build authentication URL
          relyingParty.authenticate(identifier, false, function(error, authUrl)
              {
                if (error)
                {
                  res.writeHead(200);
                  res.end('Authentication failed: ' + error.message);
                }
                else if (!authUrl)
                {
                  res.writeHead(200);
                  res.end('Authentication failed');
                }
                else
                {
                  res.writeHead(302, { Location: authUrl });
                  res.end();
                }
              });
        }
        else if(parsedUrl.pathname == '/verify')
        {
            // Verify identity assertion
            // NOTE: Passing just the URL is also possible
            relyingParty.verifyAssertion(req, function(error, result)
            {
              res.writeHead(200);
              res.end(!error && result.authenticated 
                  ? 'Success :)'
                  : 'Failure :(');
            });
        }
        else
        {
            // Deliver an OpenID form on all other URLs
            res.writeHead(200);
            res.end('<!DOCTYPE html><html><body>'
                + '<form method="get" action="/authenticate">'
                + '<p>Login using OpenID</p>'
                + '<input name="openid_identifier" />'
                + '<input type="submit" value="Login" />'
                + '</form></body></html>');
        }
    });
server.listen(80);
```

A more elaborate example including extensions can be found in `sample.js` in the GitHub repository.

## Supported Extensions
This library comes with built-in support for the following OpenID extensions:

 - The Simple Registration (SREG) 1.1 extension is implemented as `openid.SimpleRegistration`.
 - The Attribute Exchange (AX) 1.0 extension is implemented as `openid.AttributeExchange`.
 - The OAuth 1.0 extension is implemented as `openid.OAuthHybrid`.
 - The User Interface 1.0 extension is implemented as `openid.UserInterface`.
 - The Provider Authentication Policy Extension 1.0 (PAPE) is implemented as `openid.pape`.

## Storing association state

To provide a way to save/load association state, you need to mix-in two functions in
the `openid` module:

 - `saveAssociation(provider, type, handle, secret, expiry_time_in_seconds, callback)` is called when a new association is established during authentication. The callback should be called with any error as its first argument (or `null` if no error occured).
 - `loadAssociation(handle, callback)` is used to retrieve the association identified by `handle` when verification happens. The callback should be called with any error as its first argument (and `null` as the second argument), or an object with the keys `provider`, `type`, `secret` if the association was loaded successfully.

The `openid` module includes default implementations for these functions using a simple object to store the associations in-memory.

## Caching discovered information

The verification of a positive assertion (i.e. an authenticated user) can be sped up significantly by avoiding the need for additional provider discoveries when possible. In order to achieve, this speed-up, node-openid needs to cache its discovered providers. You can mix-in two functions to override the default cache, which is an in-memory cache utilizing a simple object store:
  
  - `saveDiscoveredInformation(key, provider, callback)` is used when saving a discovered provider.  The following behavior is required:
    - The `key` parameter should be uses as a key for storing the provider - it will be used as the lookup key when loading the provider. (Currently, the key is either a claimed identifier or an OP-local identifier, depending on the OpenID context.)
    - When saving fails for some reason, `callback(error)` is called with `error` being an error object specifying what failed.
    - When saving succeeds, `callback(null)` is called.

  - `loadDiscoveredInformation(key, callback)` is used to load any previously discovered information about the provider for an identifier. The following behavior is required:    
      - When no provider is found for the identifier, `callback(null, null)` is called (i.e. it is not an error to not have any data to return).
      - When loading fails for some reason, `callback(error, null)` is called with `error` being an error string specifying why loading failed.
      - When loading succeeds, `callback(null, provider)` is called with the exact provider object that was previously stored using `saveDiscoveredInformation`.

## Proxy Support
`node-openid` makes HTTP and HTTPS requests during authentication. You can have these
requests go through a proxy server, by using the following environment variables:

 - HTTP_PROXY_HOST and HTTP_PROXY_PORT control how http:// requests are sent
 - HTTPS_PROXY_HOST and HTTPS_PROXY_PORT control how https:// requests are sent

## License

OpenID for Node.js is licensed under the MIT license. See LICENSE for further details. 
The libary includes bigint functionality released by Tom Wu under the BSD license, 
and Base64 functions released by Nick Galbreath under the MIT license. Please see 
`lib/bigint.js` and `lib/base64.js` for the details of the licenses for these functions.

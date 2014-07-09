var oauthModule = require('./oauth2');

var shopify = module.exports =
oauthModule.submodule('shopify')
  .configurable({
    // oauthHost & apiHost set at runtime, since they depend on the shop endpoint
    apiHost: 'https://SHOP_NAME.myshopify.com/'
    , oauthHost: 'https://SHOP_NAME.myshopify.com/'
    , appId: 'API key in your App Info'
    , appSecret: 'Shared Secret from your App Info'
    , scope: 'types of access. See Shopify API docs for scopes available. Expects "read_products,write_themes"'
  })

  // oauthHost & apiHost set at runtime, since they depend on the shop endpoint

  .entryPath('/auth/shopify')

  .authPath('/admin/oauth/authorize')
  .authQueryParam('scope', function () {
    return this._scope && this.scope();
  })

  .accessTokenPath('/admin/oauth/access_token')

  .callbackPath('/auth/shopify/callback')

  .fetchOAuthUser( function (accessToken) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/admin/shop.json', accessToken, function (err, data, res) {
      if (err) {
        err.extra = {data: data, res: res};
        return p.fail(err);
      }
      var shop = JSON.parse(data).shop;
      p.fulfill(shop);
    });
    return p;
  })
  .moduleErrback( function (err, seqValues) {
    if (err instanceof Error) {
      var next = seqValues.next;
      return next(err);
    } else if (err.extra) {
      var shopifyResponse = err.extra.res
        , serverResponse = seqValues.res;
      serverResponse.writeHead(
          shopifyResponse.statusCode
        , shopifyResponse.headers);
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

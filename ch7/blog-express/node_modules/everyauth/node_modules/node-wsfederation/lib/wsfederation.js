var xml2js = require('xml2js');

var WsFederation = module.exports = function WsFederation (realm, homerealm, identityProviderUrl) {
  this.realm = realm;
  this.homerealm = homerealm;
  this.identityProviderUrl = identityProviderUrl;
};

WsFederation.prototype = {
  getRequestSecurityTokenUrl: function () {
    if (this.homerealm !== '')
    {
      return this.identityProviderUrl + "?wtrealm=" + this.realm + "&wa=wsignin1.0&whr=" + this.homerealm;   
    }
    else
    {
      return this.identityProviderUrl + "?wtrealm=" + this.realm + "&wa=wsignin1.0";
    } 
  },

  extractToken: function(res) {
    var promise = {};
    var parser = new xml2js.Parser();
    parser.on('end', function(result) {
      promise = result['t:RequestedSecurityToken'];
    });

    parser.parseString(res.req.body['wresult']);

    return promise;
  }
};

Object.defineProperty(WsFederation, 'realm', {
  get: function () {
    return this.realm;
  }
});

Object.defineProperty(WsFederation, 'homeRealm', {
  get: function () {
    return this.homeRealm;
  }
});

Object.defineProperty(WsFederation, 'identityProviderUrl', {
  get: function () {
    return this.identityProviderUrl;
  }
});
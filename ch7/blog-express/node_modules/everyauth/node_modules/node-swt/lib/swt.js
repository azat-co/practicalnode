var crypto = require('crypto');

var hmacSHA256 = "&HMACSHA256=";

var Swt = module.exports = function Swt (rawToken) {
  this.rawToken = rawToken;
  this.parse();
};

Swt.prototype = {
  isExpired: function() {
      var epoch = parseInt(this.expiresOn, 10);   
      return new Date() > new Date(epoch * 1000);    
  },

  parse: function(rawToken) {
    if (this.rawToken.length == 0) return; 

    this.claims = {};
    var tuples = this.rawToken.split("&");
    for(var i = 0; i < tuples.length; i++ ){
      var keyValuePair = tuples[i].split("=");

      var key = decodeURIComponent(keyValuePair[0]); 
      var value = decodeURIComponent(keyValuePair[1]);

      if(key == 'Audience') {
        this.audience = value;
        continue;
      }

      if(key == 'ExpiresOn') {
        this.expiresOn = value;
        continue;
      }

      if(key == 'Issuer') {
        this.issuer = value;
        continue;
      }
                 
      this.claims[key] = value;
    } 
  },

  isValid: function(rawToken, audienceUri, swtSigningKey) {
    var chunks = rawToken.split(hmacSHA256);
    if(chunks.length < 2)
      return false;
  
    if(this.isExpired())
      return false;

     if(this.audience !== audienceUri)
        return false;

    var hash = crypto.createHmac('RSA-SHA256', new Buffer(swtSigningKey, 'base64').toString('binary')).update(new Buffer(chunks[0], 'utf8')).digest('base64');

    return (hash === decodeURIComponent(chunks[1]));
  }
};

Object.defineProperty(Swt, 'claimValue', {
  get: function (claimName) {
    return this.claims[claimName];
  }
});

Object.defineProperty(Swt, 'rawToken', {
  get: function () {
    return this.rawToken;
  }
});

Object.defineProperty(Swt, 'audience', {
  get: function () {
    return this.audience;
  }
});

Object.defineProperty(Swt, 'issuer', {
  get: function () {
    return this.issuer;
  }
});

Object.defineProperty(Swt, 'expiresOn', {
  get: function () {
    return this.expiresOn;
  }
});
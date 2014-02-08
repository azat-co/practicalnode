var OAuth = require('OAuth');
var OAuth2 = OAuth.OAuth2;
var twitterConsumerKey = 'your key';
var twitterConsumerSecret = 'your secret';
var oauth2 = new OAuth2(server.config.keys.twitter.consumerKey,
  twitterConsumerSecret,
  'https://api.twitter.com/',
  null,
  'oauth2/token',
  null
);

oauth2.getOAuthAccessToken(
  '',
  {'grant_type':'client_credentials'},
  function (e, access_token, refresh_token, results){
    console.log('bearer: ',access_token);
  }
);
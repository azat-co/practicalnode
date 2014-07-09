var oauthModule = require('./oauth')
  , url = require('url');

var evernote = module.exports =
oauthModule.submodule('evernote')
  .oauthHost('https://www.evernote.com')
  .entryPath('/auth/evernote')
  .callbackPath('/auth/evernote/callback')
  .authorizePath('/OAuth.action')
  .requestTokenPath('/oauth')
  .accessTokenPath('/oauth')
  .fetchOAuthUser( function (accessToken, accessTokenSecret, params) {
    var oauthUser = {
      shardId: params.edam_shard
    , userId: parseInt(params.edam_userId, 10)
    };
    accessToken.split(':').forEach(function(item) {
      item = item.split('=');
      if (item[0] === 'A') {
        oauthUser['username'] = item[1];
      }
    });
    return oauthUser;
  });
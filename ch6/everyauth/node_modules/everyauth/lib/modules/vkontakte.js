var oauthModule = require('./oauth2')
  , url = require('url');

var vkontakte = module.exports =
oauthModule.submodule('vkontakte')
  .configurable({
      display: 'set to "touch" if you want users to see a mobile optimized version of the auth page'
    , scope: 'specify types of access: See http://vk.com/developers.php?oid=-1&p=Права_доступа_приложений'
    , fields: 'specify fields of profile: See http://vk.com/developers.php?oid=-1&p=Описание_полей_параметра_fields'
  })

  .oauthHost('https://api.vk.com')
  .apiHost('https://api.vk.com')
  .entryPath('/auth/vkontakte')
  .callbackPath('/auth/vkontakte/callback')

  .authQueryParam('response_type', 'code')

  .authQueryParam('display', function () {
    return this._display && this.display();
  })
  .authQueryParam('scope', function () {
    return this._scope && this.scope();
  })

  .fetchOAuthUser( function (accessToken, http) {
    var promise = this.Promise();
    var params = this._fields && this.fields();
    var fields = (params) ? '&fields=' + params : '';
    this.oauth.get(this.apiHost() + '/method/getProfiles?uids=' + http.extra.user_id + fields, accessToken, function (err, data) {
      if (err) return promise.fail(err.error_message);
      var data = JSON.parse(data)
      if (data.error) return promise.fail(data.error.error_msg);
      var oauthUser = data.response[0];
      promise.fulfill(oauthUser);
    })
    return promise;
  })

  .authCallbackDidErr(function(req) {
    var parsedUrl = url.parse(req.url, true);
    return parsedUrl.query && !!parsedUrl.query.error;
  })

  .convertErr( function (data) {
    return new Error(JSON.parse(data).error.error_msg);
  });
var oauthModule = require('./oauth2')
, url = require('url')
, fs = require('fs')
, crypto = require('crypto');

var mailru = module.exports =
oauthModule.submodule('mailru')
.configurable({
    display: 'set to "mobile" if you want users to see a mobile optimized version of the auth page',
    scope:  'specify types of access: See http://api.mail.ru/docs/guides/restapi/#permissions'
})
.oauthHost('https://connect.mail.ru')
.apiHost('http://www.appsmail.ru/platform/api')
.entryPath('/auth/mailru')
.callbackPath('/auth/mailru/callback')

.authQueryParam('display', function () {
    return this._display && this.display();
})
.authQueryParam('response_type', 'code')
.authQueryParam('scope', function () {
    return this._scope && this.scope();
})

.accessTokenParam('grant_type', 'authorization_code')
.accessTokenHttpMethod('post')
.postAccessTokenParamsVia('data')
.accessTokenPath('/oauth/token')

.fetchOAuthUser( function (accessToken, http) {
    var promise = this.Promise(),
    extradata = http.extra;

    if(typeof accessToken === 'undefined'){
        if(typeof extradata.access_token === 'undefined') {
            var strextra = JSON.stringify(extradata).replace(/^\{"(.*)":""\}$/,'"$1"'),
            extra = eval('(' + JSON.parse(strextra) + ')');
            accessToken = extra.access_token;
        } else {
            accessToken = extra.access_token;
        }
    }

    var query = {
        app_id: this.appId(),
        method: 'users.getInfo',
        secure:1,
        session_key: accessToken
    },
    data = '',
    fields = [];

    for ( key in query ) {
        data += key + '=' + query[key];
    }
    data += this.appSecret();
    query.sig = crypto.createHash('md5').update(data).digest("hex");

    for ( key in query ) {
        fields.push(key + '=' + query[key]);
    }

    this.oauth.get(this.apiHost() + '?' + fields.join('&'), accessToken, function (err, data) {
        if (err) {
            if (err.error) {
                promise.fail(err.error.error_msg)
            }
            else {
                promise.fail(err.error_message);
            }
        }
        var data = JSON.parse(data);
        if (data.error) {
            promise.fail(data.error.error_msg)
        }
        else {
            var oauthUser = data[0];
            promise.fulfill(oauthUser);
        }
    });
    return promise;
})

.authCallbackDidErr(function(req) {
    var parsedUrl = url.parse(req.url, true);
    return parsedUrl.query && !!parsedUrl.query.error;
})

.convertErr( function (data) {
    return new Error(JSON.parse(data).error.error_msg);
});

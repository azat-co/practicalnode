var oauthModule = require('./oauth2')
    , request = require('request');

var box = module.exports =
    oauthModule.submodule('box')
        .configurable({
            scope: 'specify types of access: (no scope), user, public_repo, repo, gist'
        })

        .oauthHost('https://www.box.com')
        .apiHost('https://api.box.com/2.0')

        .authPath('/api/oauth2/authorize')
        .accessTokenPath('/api/oauth2/token')
        .postAccessTokenParamsVia('data')

        .entryPath('/auth/box')
        .callbackPath('/auth/box/callback')

        .authQueryParam('response_type', 'code')
        .accessTokenParam('grant_type', 'authorization_code')

        .fetchOAuthUser( function (accessToken) {
            var promise = this.Promise();
            request.get({
                url: this.apiHost() + '/users/me'
                , headers: { Authorization: "Bearer " + accessToken }
            }, function (err, res, body) {
                if (err) {
                    err.extra = {res: res, data: body};
                    return promise.fail(err);
                }
                if (parseInt(res.statusCode/100, 10) !== 2) {
                    return promise.fail({extra: {data: body, res: res}});
                }
                var oauthUser = JSON.parse(body);
                return promise.fulfill(oauthUser);
            });
            return promise;
        })
        .moduleErrback( function (err, seqValues) {
            if (err instanceof Error) {
                var next = seqValues.next;
                return next(err);
            } else if (err.extra) {
                var ghResponse = err.extra.res
                    , serverResponse = seqValues.res;
                serverResponse.writeHead(
                    ghResponse.statusCode
                    , ghResponse.headers);
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

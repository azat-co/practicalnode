var express = require('express')
  , everyauth = require('../index')
  , conf = require('./conf')
  , everyauthRoot = __dirname + '/..';

everyauth.debug = true;

var usersById = {};
var nextUserId = 0;

function addUser (source, sourceUser) {
  var user;
  if (arguments.length === 1) { // password-based
    user = sourceUser = source;
    user.id = ++nextUserId;
    return usersById[nextUserId] = user;
  } else { // non-password-based
    user = usersById[++nextUserId] = {id: nextUserId};
    user[source] = sourceUser;
  }
  return user;
}

var usersByVimeoId = {};
var usersByJustintvId = {};
var usersBy37signalsId = {};
var usersByTumblrName = {};
var usersByDropboxId = {};
var usersByFbId = {};
var usersByTwitId = {};
var usersByGhId = {};
var usersByInstagramId = {};
var usersByFoursquareId = {};
var usersByGowallaId = {};
var usersByLinkedinId = {};
var usersByGoogleId = {};
var usersByAngelListId = {};
var usersByYahooId = {};
var usersByGoogleHybridId = {};
var usersByReadabilityId = {};
var usersByBoxId = {};
var usersByOpenId = {};
var usersByDwollaId = {};
var usersByVkId = {};
var usersBySkyrockId = {};
var usersByEvernoteId = {};
var usersByAzureAcs = {};
var usersByTripIt = {};
var usersBy500pxId = {};
var usersBySoundCloudId = {};
var usersByMailchimpId = {};
var usersMailruId = {};
var usersByMendeleyId = {};
var usersByShopifyId = {};
var usersByStripeId = {};
var usersBySalesforceId = {};
var usersByLogin = {
  'brian@example.com': addUser({ login: 'brian@example.com', password: 'password'})
};

everyauth.everymodule
  .findUserById( function (id, callback) {
    callback(null, usersById[id]);
  });

everyauth.azureacs
  .identityProviderUrl('https://acssample1.accesscontrol.windows.net/v2/wsfederation/')
  .entryPath('/auth/azureacs')
  .callbackPath('/auth/azureacs/callback')
  .signingKey('d0julb9JNbCB8J2ACHzxU33SSiqbylQveQtuwOEvz24=')
  .realm('urn:nodeacslocal')
  .homeRealm('')
  .tokenFormat('swt')
  .findOrCreateUser( function (session, acsUser) {
     return usersByAzureAcs[acsUser.id] || (usersByAzureAcs[acsUser.id] = addUser('azureAcs', acsUser));
  })
  .redirectPath('/');

everyauth
  .openid
    .myHostname('http://local.host:3000')
    .findOrCreateUser( function (session, userMetadata) {
      return usersByOpenId[userMetadata.claimedIdentifier] ||
        (usersByOpenId[userMetadata.claimedIdentifier] = addUser('openid', userMetadata));
    })
    .redirectPath('/');


everyauth
  .facebook
    .appId(conf.fb.appId)
    .appSecret(conf.fb.appSecret)
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, fbUserMetadata) {
      return usersByFbId[fbUserMetadata.id] ||
        (usersByFbId[fbUserMetadata.id] = addUser('facebook', fbUserMetadata));
    })
    .redirectPath('/');

everyauth
  .twitter
    .consumerKey(conf.twit.consumerKey)
    .consumerSecret(conf.twit.consumerSecret)
    .findOrCreateUser( function (sess, accessToken, accessSecret, twitUser) {
      return usersByTwitId[twitUser.id] || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
    })
    .redirectPath('/');

everyauth
  .password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login.jade')
//    .loginLocals({
//      title: 'Login'
//    })
//    .loginLocals(function (req, res) {
//      return {
//        title: 'Login'
//      }
//    })
    .loginLocals( function (req, res, done) {
      setTimeout( function () {
        done(null, {
          title: 'Async login'
        });
      }, 200);
    })
    .authenticate( function (login, password) {
      var errors = [];
      if (!login) errors.push('Missing login');
      if (!password) errors.push('Missing password');
      if (errors.length) return errors;
      var user = usersByLogin[login];
      if (!user) return ['Login failed'];
      if (user.password !== password) return ['Login failed'];
      return user;
    })

    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register.jade')
//    .registerLocals({
//      title: 'Register'
//    })
//    .registerLocals(function (req, res) {
//      return {
//        title: 'Sync Register'
//      }
//    })
    .registerLocals( function (req, res, done) {
      setTimeout( function () {
        done(null, {
          title: 'Async Register'
        });
      }, 200);
    })
    .validateRegistration( function (newUserAttrs, errors) {
      var login = newUserAttrs.login;
      if (usersByLogin[login]) errors.push('Login already taken');
      return errors;
    })
    .registerUser( function (newUserAttrs) {
      var login = newUserAttrs[this.loginKey()];
      return usersByLogin[login] = addUser(newUserAttrs);
    })

    .loginSuccessRedirect('/')
    .registerSuccessRedirect('/');

everyauth.github
  .appId(conf.github.appId)
  .appSecret(conf.github.appSecret)
  .findOrCreateUser( function (sess, accessToken, accessTokenExtra, ghUser) {
      return usersByGhId[ghUser.id] || (usersByGhId[ghUser.id] = addUser('github', ghUser));
  })
  .redirectPath('/');

everyauth.instagram
  .appId(conf.instagram.clientId)
  .appSecret(conf.instagram.clientSecret)
  .scope('basic')
  .findOrCreateUser( function (sess, accessToken, accessTokenExtra, hipster) {
      return usersByInstagramId[hipster.id] || (usersByInstagramId[hipster.id] = addUser('instagram', hipster));
  })
  .redirectPath('/');

everyauth.foursquare
  .appId(conf.foursquare.clientId)
  .appSecret(conf.foursquare.clientSecret)
  .findOrCreateUser( function (sess, accessTok, accessTokExtra, addict) {
      return usersByFoursquareId[addict.id] || (usersByFoursquareId[addict.id] = addUser('foursquare', addict));
  })
  .redirectPath('/');

everyauth.gowalla
  .appId(conf.gowalla.apiKey)
  .appSecret(conf.gowalla.apiSecret)
  .moduleErrback( function(err) {
    console.log("moduleErrback for Gowalla", err);
  })
  .findOrCreateUser( function (sess, accessToken, accessTokenExtra, loser) {
    return usersByGowallaId[loser.url] || (usersByGowallaId[loser.url] = addUser('gowalla', loser));
  })
  .redirectPath('/');

everyauth.linkedin
  .consumerKey(conf.linkedin.apiKey)
  .consumerSecret(conf.linkedin.apiSecret)
  .findOrCreateUser( function (sess, accessToken, accessSecret, linkedinUser) {
    return usersByLinkedinId[linkedinUser.id] || (usersByLinkedinId[linkedinUser.id] = addUser('linkedin', linkedinUser));
  })
  .redirectPath('/');

everyauth.google
  .appId(conf.google.clientId)
  .appSecret(conf.google.clientSecret)
  .scope('https://www.googleapis.com/auth/userinfo.profile https://www.google.com/m8/feeds/')
  .findOrCreateUser( function (sess, accessToken, extra, googleUser) {
    googleUser.refreshToken = extra.refresh_token;
    googleUser.expiresIn = extra.expires_in;
    return usersByGoogleId[googleUser.id] || (usersByGoogleId[googleUser.id] = addUser('google', googleUser));
  })
  .redirectPath('/');

everyauth.angellist
  .appId(conf.angellist.clientId)
  .appSecret(conf.angellist.clientSecret)
  .findOrCreateUser( function (sess, accessToken, extra, angellistUser) {
    angellistUser.refreshToken = extra.refresh_token;
    angellistUser.expiresIn = extra.expires_in;
    return usersByAngelListId[angellistUser.id] || (usersByAngelListId[angellistUser.id] = addUser('angellist', angellistUser));
  })
  .redirectPath('/');

everyauth.yahoo
  .consumerKey(conf.yahoo.consumerKey)
  .consumerSecret(conf.yahoo.consumerSecret)
  .findOrCreateUser( function (sess, accessToken, accessSecret, yahooUser) {
    return usersByYahooId[yahooUser.id] || (usersByYahooId[yahooUser.id] = addUser('yahoo', yahooUser));
  })
  .redirectPath('/');

everyauth.googlehybrid
  .myHostname('http://local.host:3000')
  .consumerKey(conf.googlehybrid.consumerKey)
  .consumerSecret(conf.googlehybrid.consumerSecret)
  .scope(['http://docs.google.com/feeds/','http://spreadsheets.google.com/feeds/'])
  .findOrCreateUser( function(session, userAttributes) {
    return usersByGoogleHybridId[userAttributes.claimedIdentifier] || (usersByGoogleHybridId[userAttributes.claimedIdentifier] = addUser('googlehybrid', userAttributes));
  })
  .redirectPath('/');

everyauth.readability
  .consumerKey(conf.readability.consumerKey)
  .consumerSecret(conf.readability.consumerSecret)
  .findOrCreateUser( function (sess, accessToken, accessSecret, reader) {
      return usersByReadabilityId[reader.username] || (usersByReadabilityId[reader.username] = addUser('readability', reader));
  })
  .redirectPath('/');

everyauth
  .dropbox
    .consumerKey(conf.dropbox.consumerKey)
    .consumerSecret(conf.dropbox.consumerSecret)
    .findOrCreateUser( function (sess, accessToken, accessSecret, dropboxUserMetadata) {
      return usersByDropboxId[dropboxUserMetadata.uid] ||
        (usersByDropboxId[dropboxUserMetadata.uid] = addUser('dropbox', dropboxUserMetadata));
    })
    .redirectPath('/')

everyauth.vimeo
	.consumerKey(conf.vimeo.consumerKey)
	.consumerSecret(conf.vimeo.consumerSecret)
	.findOrCreateUser( function (sess, accessToken, accessSecret, vimeoUser) {
		return usersByVimeoId[vimeoUser.id] ||
			(usersByVimeoId[vimeoUser.id] = vimeoUser);
	})
	.redirectPath('/')

everyauth.justintv
  .consumerKey(conf.justintv.consumerKey)
  .consumerSecret(conf.justintv.consumerSecret)
  .findOrCreateUser( function (sess, accessToken, accessSecret, justintvUser) {
    return usersByJustintvId[justintvUser.id] ||
      (usersByJustintvId[justintvUser.id] = addUser('justintv', justintvUser));
  })
  .redirectPath('/')

everyauth['37signals']
  .appId(conf['_37signals'].clientId)
  .appSecret(conf['_37signals'].clientSecret)
  .findOrCreateUser( function (sess, accessToken, accessSecret, _37signalsUser) {
    return usersBy37signalsId[_37signalsUser.id] ||
      (usersBy37signalsId[_37signalsUser.identity.id] = addUser('37signals', _37signalsUser));
  })
  .redirectPath('/')

everyauth.tumblr
  .consumerKey(conf.tumblr.consumerKey)
  .consumerSecret(conf.tumblr.consumerSecret)
  .findOrCreateUser( function (sess, accessToken, accessSecret, tumblrUser) {
    return usersByTumblrName[tumblrUser.name] ||
      (usersByTumblrName[tumblrUser.name] = addUser('tumblr', tumblrUser));
  })
  .redirectPath('/');

everyauth.box
  .appId(conf.box.apiKey)
  .findOrCreateUser( function (sess, authToken, boxUser) {
    return usersByBoxId[boxUser.user_id] ||
      (usersByDropboxId[boxUser.user_id] = addUser('box', boxUser));
  })
  .redirectPath('/');

everyauth.dwolla
  .appId(conf.dwolla.clientId)
  .appSecret(conf.dwolla.clientSecret)
  .scope('accountinfofull')
  .findOrCreateUser( function (sess, accessToken, accessTokenExtra, dwollaUser) {
    return usersByDwollaId[dwollaUser.id] || (usersByDwollaId[dwollaUser.id] = addUser('dwolla', dwollaUser));
  })
  .redirectPath('/');

everyauth.vkontakte
  .appId(conf.vkontakte.appId)
  .appSecret(conf.vkontakte.appSecret)
  .findOrCreateUser( function (session, accessToken, accessTokenExtra, vkUserMetadata) {
    return usersByVkId[vkUserMetadata.uid] ||
      (usersByVkId[vkUserMetadata.uid] = addUser('vkontakte', vkUserMetadata));
  })
  .redirectPath('/');

everyauth.mailru
  .appId(conf.mailru.appId)
  .appSecret(conf.mailru.appSecret)
  .findOrCreateUser( function (session, accessToken, accessTokenExtra, mlUserMetadata) {
    return usersMailruId[mlUserMetadata.uid] ||
      (usersMailruId[mlUserMetadata.uid] = addUser('mailru', mlUserMetadata));
  })
  .redirectPath('/');

everyauth.skyrock
  .consumerKey(conf.skyrock.consumerKey)
  .consumerSecret(conf.skyrock.consumerSecret)
  .findOrCreateUser( function (sess, accessToken, accessTokenExtra, skyrockUser) {
    return usersBySkyrockId[skyrockUser.id_user] || (usersBySkyrockId[skyrockUser.id_user] = addUser('skyrock', skyrockUser));
  })
  .redirectPath('/');

everyauth.evernote
  .oauthHost(conf.evernote.oauthHost)
  .consumerKey(conf.evernote.consumerKey)
  .consumerSecret(conf.evernote.consumerSecret)
  .findOrCreateUser( function (sess, accessToken, accessTokenExtra, enUserMetadata) {
    return usersByEvernoteId[enUserMetadata.userId] || (usersByEvernoteId[enUserMetadata.userId] = addUser('evernote', enUserMetadata));
  })
  .redirectPath('/');

everyauth.tripit
  .consumerKey(conf.tripit.consumerKey)
  .consumerSecret(conf.tripit.consumerSecret)
  .findOrCreateUser( function (sess, accessToken, accessTokenExtra, tripitProfile) {
    var userId = tripitProfile['@attributes'].ref;
    return usersByTripIt[userId] || (usersByTripIt[userId] = addUser('tripit', tripitProfile));
  })
  .redirectPath('/');

everyauth['500px']
  .consumerKey(conf._500px.consumerKey)
  .consumerSecret(conf._500px.consumerSecret)
  .findOrCreateUser(function(sess, accessToken, accessSecret, user) {
    return usersBy500pxId[user.id] || (usersBy500pxId[user.id] = addUser('500px', user));
  })
  .redirectPath('/');

everyauth.mendeley
  .consumerKey(conf.mendeley.consumerKey)
  .consumerSecret(conf.mendeley.consumerSecret)
  .findOrCreateUser(function(sess, accessToken, accessSecret, user) {
    return usersByMendeleyId[user.main.profile_id] || (usersByMendeleyId[user.main.profile_id] = addUser('mendeley', user));
  })
  .redirectPath('/');

everyauth
  .soundcloud
    .appId(conf.soundcloud.appId)
    .appSecret(conf.soundcloud.appSecret)
    .findOrCreateUser( function (sess, accessToken, accessTokenExtra, soundcloudUser) {
      return usersBySoundCloudId[soundcloudUser.id] || (usersBySoundCloudId[soundcloudUser.id] = addUser('soundcloud', soundcloudUser));
    })
    .redirectPath('/');

everyauth
  .mixi
    .appId(conf.mixi.consumerKey)
    .appSecret(conf.mixi.consumerSecret)
    .scope(conf.mixi.scope)
    .display('pc')
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, mixiUserMetadata) {
      return usersByFbId[mixiUserMetadata.id] ||
        (usersByFbId[mixiUserMetadata.id] = addUser('mixi', mixiUserMetadata));
    })
    .redirectPath('/');

everyauth
  .mailchimp
    .appId(conf.mailchimp.appId)
    .appSecret(conf.mailchimp.appSecret)
    .myHostname(process.env.HOSTNAME || "http://127.0.0.1:3000")//MC requires 127.0.0.1 for dev
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, mailchimpUser){
      return usersByMailchimpId[mailchimpUser.id] ||
        (usersByMailchimpId[mailchimpUser.user_id] = addUser('mailchimp', mailchimpUser));
    })
    .redirectPath("/");

everyauth
  .shopify
    .apiHost('https://SHOP-NAME.myshopify.com') 
    .oauthHost('https://SHOP-NAME.myshopify.com') 
    .appId(conf.shopify.appId)
    .appSecret(conf.shopify.appSecret)
    .scope(conf.shopify.scope)
    .findOrCreateUser( function (sess, accessToken, accessSecret, shopifyUser) {
      return usersByShopifyId[shopifyUser.id] ||
        (usersByShopifyId[shopifyUser.id] = addUser('shopify', shopifyUser));
    })
    .redirectPath("/");

everyauth
  .stripe
    .appId(conf.stripe.appId)
    .appSecret(conf.stripe.appSecret)
    .scope(conf.stripe.scope)
    .landing(conf.stripe.landing)
    .findOrCreateUser( function (sess, accessToken, accessTokenExtra, stripeUser) {
      return usersByStripeId[stripeUser.id] ||
        (usersByStripeId[stripeUser.id] = addUser('stripe', stripeUser));
    })
    .redirectPath("/");

everyauth
  .salesforce
    .appId(conf.salesforce.appId)
    .appSecret(conf.salesforce.appSecret)
    .scope(conf.salesforce.scope)
    .findOrCreateUser( function (sess, accessToken, accessTokenExtra, salesforceUser) {
      return usersBySalesforceId[salesforceUser.id] ||
        (usersBySalesforceId[salesforceUser.id] = addUser('salesforce', salesforceUser));
    })
    .redirectPath("/");

var app = express();
app.use(express.static(__dirname + '/public'))
  .use(express.favicon())
  .use(express.bodyParser())
  .use(express.cookieParser('htuayreve'))
  .use(express.session())
  .use(everyauth.middleware());

app.configure( function () {
  app.set('view engine', 'jade');
  app.set('views', everyauthRoot + '/example/views');
});

app.get('/', function (req, res) {
  res.render('home');
});

app.listen(3000);

console.log('Go to http://local.host:3000');

module.exports = app;

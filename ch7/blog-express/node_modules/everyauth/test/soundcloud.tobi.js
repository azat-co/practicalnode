var tobi = require('tobi')
  , expect = require('expect.js')
  , creds = require('./creds.js');

require('./util/expect.js');

describe('SoundCloud', function () {
  var app, browser;

  beforeEach( function () {
    delete require.cache[require.resolve('./app')]
    app = require('./app')
    tobi.Browser.browsers = {};
    var everyauth = require('../index');
    everyauth.debug = false;
    browser = tobi.createBrowser(3000, 'local.host');
    browser.userAgent = 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.100 Safari/534.30';
  });

  afterEach( function () {
    app.close();
  });

  it('should successfully login with the right username, password', function (done) {
    this.timeout(10000);
    browser.get('/auth/soundcloud', function (res, $) {
      $('#oauth2-login-form')
        .fill({
            username: creds.soundcloud.login
          , password: creds.soundcloud.password })
        .submit(function (res, $) {
          expect($('h2')).to.have.text('Authenticated');
          expect($('h2')).to.not.have.text('Not Authenticated');
          done();
        });
    });
  });
});

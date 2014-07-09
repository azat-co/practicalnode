var tobi = require('tobi')
  , expect = require('expect.js')
  , creds = require('./creds.js');

require('./util/expect.js');

describe('Twitter', function () {
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
    browser.get('/auth/twitter', function (res, $) {
      $('#oauth_form')
        .fill({
            'session[username_or_email]': creds.twitter.login
          , 'session[password]': creds.twitter.password })
        .submit(function (res, $) {
          expect($('.happy.notice h2')).to.have.text('Redirecting you back to the application. This may take a few moments.');
          $('.happy.notice a').click( function (res, $) {
            expect(res).to.have.status(200);
            expect($('h2')).to.have.text('Authenticated');
            expect($('h2')).to.not.have.text('Not Authenticated');
            done();
          });
        });
    });
  });
});

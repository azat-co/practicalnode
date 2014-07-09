var tobi = require('tobi')
  , expect = require('expect.js')
  , creds = require('./creds.js');

require('./util/expect.js');

describe('Mailchimp', function () {
  var app, browser;

  beforeEach( function () {
    delete require.cache[require.resolve('./app')]
    app = require('./app')
    tobi.Browser.browsers = {};
    var everyauth = require('../index');
    everyauth.debug = false;
    browser = tobi.createBrowser(3000, '127.0.0.1'); //mailchimp requires 127.0.0.1 instead of localhost in dev/test. 
    browser.userAgent = 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.100 Safari/534.30';
  });

  afterEach( function () {
    app.close();
  });

  it('should successfully login with the right username, password', function (done) {
    this.timeout(10000);
    browser.get('/auth/mailchimp', function (res, $) {
      $('#login-form')
        .fill({
            username: creds.mailchimp.login
          , password: creds.mailchimp.password })
        .submit(function (res, $) {
          expect($('h2')).to.have.text('Authenticated');
          expect($('h2')).to.not.have.text('Not Authenticated');
          done();
        });
    });
  });
});
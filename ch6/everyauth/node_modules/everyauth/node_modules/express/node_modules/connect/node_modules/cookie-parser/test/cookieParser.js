
var cookieParser = require('..')
var http = require('http')
var request = require('supertest')
var signature = require('cookie-signature')

describe('connect.cookieParser()', function(){
  var server
  before(function(){
    server = createServer('keyboard cat')
  })

  describe('when no cookies are sent', function(){
    it('should default req.cookies to {}', function(done){
      request(server)
      .get('/')
      .expect(200, '{}', done)
    })

    it('should default req.signedCookies to {}', function(done){
      request(server)
      .get('/signed')
      .expect(200, '{}', done)
    })
  })

  describe('when cookies are sent', function(){
    it('should populate req.cookies', function(done){
      request(server)
      .get('/')
      .set('Cookie', 'foo=bar; bar=baz')
      .expect(200, '{"foo":"bar","bar":"baz"}', done)
    })
  })

  describe('when a secret is given', function(){
    var val = signature.sign('foobarbaz', 'keyboard cat');
    // TODO: "bar" fails...

    it('should populate req.signedCookies', function(done){
      request(server)
      .get('/signed')
      .set('Cookie', 'foo=s:' + val)
      .expect(200, '{"foo":"foobarbaz"}', done)
    })

    it('should remove the signed value from req.cookies', function(done){
      request(server)
      .get('/')
      .set('Cookie', 'foo=s:' + val)
      .expect(200, '{}', done)
    })

    it('should omit invalid signatures', function(done){
      server.listen()
      request(server)
      .get('/signed')
      .set('Cookie', 'foo=' + val + '3')
      .expect(200, '{}', function(err){
        if (err) return done(err)
        request(server)
        .get('/')
        .set('Cookie', 'foo=' + val + '3')
        .expect(200, '{"foo":"foobarbaz.CP7AWaXDfAKIRfH49dQzKJx7sKzzSoPq7/AcBBRVwlI3"}', done)
      });
    })
  })
})

function createServer(secret) {
  var _parser = cookieParser(secret)
  return http.createServer(function(req, res){
    _parser(req, res, function(err){
      if (err) {
        res.statusCode = 500
        res.end(err.message)
        return
      }

      var cookies = '/signed' === req.url
        ? req.signedCookies
        : req.cookies
      res.end(JSON.stringify(cookies))
    })
  })
}

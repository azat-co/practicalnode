var satisfy = require('./util/satisfy');

// TODO Add case of person trying to take an existing login

describe('password', function () {
  var app;

  before( function () {
    app = require('./app');
  });

  after( function () {
    app.close();
  });

  describe('registration', function () {
    var regUrl = 'http://localhost:3000/register';

    it('should succeed if provided with a username and password', function (done) {
      satisfy(regUrl)
        .fill({ email: 'newuser@example.com', password: 'pass'})
        .submit()

        .expect('h2').to.have.text('Authenticated')
        .expect('h2').to.not.have.text('Not Authenticated')

        .run(done);
    });

    describe('failing', function () {
      it('should fail with no email, no password', function (done) {
        satisfy(regUrl)
          .fill({email: '', password: ''})
          .submit()

          .expect('#errors li:first').to.have.text('Missing email')
          .expect('#errors li:eq(1)').to.have.text('Missing password')

          .run(done);
      });

      it('should fail with an invalid email, non-empty password', function (done) {
        satisfy(regUrl)
          .fill({ email: 'newuser', password: 'pass' })
          .submit()

          .expect('#errors').to.have.text('Please correct your email.')
          .run(done);
      });

      it('should fail with an invalid email, no password', function (done) {
        satisfy(regUrl)
          .fill({email: 'newuser', password: ''})
          .submit()

          .expect('#errors li:first').to.have.text('Please correct your email.')
          .expect('#errors li:eq(1)').to.have.text('Missing password')

          .run(done);
      });

      it('should fail with a valid email, no password', function (done) {
        satisfy(regUrl)
          .fill({email: 'abc@example.com', password: ''})
          .submit()

          .expect('#errors').to.have.text('Missing password')

          .run(done);
        });
      });
    });

  describe('login', function () {
    var loginUrl = 'http://localhost:3000/login';

    it('should succeed with the right email + password', function (done) {
      satisfy(loginUrl)
        .fill({ email: 'brian@example.com', password: 'password' })
        .submit()

        .expect('h2').to.have.text('Authenticated')
        .expect('h2').to.not.have.text('Not Authenticated')

        .run(done);
    });

    describe('failing', function () {
      it('should fail with the wrong password', function (done) {
        satisfy(loginUrl)
          .fill({ email: 'brian@example.com', password: 'wrongpassword' })
          .submit()

          .expect('#errors').to.have.text('Login failed')

          .run(done);
      });

      it('should fail with an empty password', function (done) {
        satisfy(loginUrl)
          .fill({ email: 'brian@example.com', password: '' })
          .submit()

          .expect('#errors').to.have.text('Missing password')

          .run(done);
      });

      it('should fail with no email, no password', function (done) {
        satisfy(loginUrl)
          .fill({ email: '', password: '' })
          .submit()

          .expect('#errors li:first').to.have.text('Missing login')
          .expect('#errors li:eq(1)').to.have.text('Missing password')

          .run(done);
      });
    });
  });
});

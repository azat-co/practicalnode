var passwordModule = require('./password');

var ldap = module.exports =
passwordModule.submodule('ldap')
  .configurable({
      host: 'the ldap host'
    , port: 'the ldap port'
  })
  .authenticate( function (login, password, req, res) {
    var promise = this.Promise();
    ldapauth.authenticate(this.host(), this.port(), login, password, function (err, result) {
      var user, errors;
      if (err) {
        return promise.fail(err);
      }
      if (result === false) {
        errors = ['Login failed.'];
        return promise.fulfill(errors);
      } else if (result === true) {
        user = {};
        user[this.loginKey()] = login;
        return promise.fulfill(user);
      } else {
        throw new Error('ldapauth returned a result that was neither `true` nor `false`');
      }
    });
    return promise;
  });

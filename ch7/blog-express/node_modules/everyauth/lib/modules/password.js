var everyModule = require('./everymodule');

/**
 * This is used to generate the render methods used with
 *
 * - `displayLogin`
 * - `respondToLoginFail`
 * - `displayRegister`
 * - `respondToRegistrationFail`
 *
 * The generated functions have the signature
 *
 *     function (req, res, *extraParams) {...}
 *
 * @param {String} type is either 'login' or 'register'
 * @param {Function} localsDefault is a function that returns the default
 * locals object. It has the signature
 *
 *     function (*extraParams) {...}
 *
 * So, for example, if the generated function can handle incoming args:
 *
 *     function render (req, res, errors, data)
 *
 * , then the `localsDefault` signature can see the params
 *
 *     function localsDefault (errors, data)
 *
 * @returns {Function} a generated render function with signature
 *
 *     function (req, res, *extraParams) {...}
 */
function renderGenerator (type, localsDefault) {
  return function render (req, res) {
    var locals, render, layout
      , extraLocals
      , view = this[type + 'View'](), arity
      , trailingArgs = Array.prototype.slice.call(arguments, 2);

    if (res.render) {
      locals = 
        localsDefault.apply(this, trailingArgs);
      layout = this['_' + type + 'Layout'];
      render = function render (locals) {
        if ('undefined' !== typeof layout) {
          locals.layout = layout;
        }
        res.render(view, locals);
      };

      extraLocals = this['_' + type + 'Locals'];
      if ('function' !== typeof extraLocals) {
        for (var k in extraLocals) {
          locals[k] = extraLocals[k];
        }
        return render(locals);
      }

      arity = extraLocals.length;
      if (arity === 2) {
        // Dynamic sync locals
        extraLocals = extraLocals(req, res);
        for (var k in extraLocals) {
          locals[k] = extraLocals[k];
        }
        return render(locals);
      } else if (arity === 3) {
        // Dynamic async locals
        return extraLocals(req, res, function (err, extraLocals) {
          if (err) throw err; // TODO Call global configurable error handler
          for (var k in extraLocals) {
            locals[k] = extraLocals[k];
          }
          return render(locals);
        });
      } else {
        throw new Error('Your `locals` function must have arity 2 or 3');
      }
    } else {
      res.writeHead(200, {'Content-Type': 'text/html'});
      if ('function' === typeof view) {
        res.end(view.apply(this, trailingArgs));
      } else {
        res.end(view);
      }
    }
  };
}

var renderLogin = renderGenerator('login',
  function () {
    var locals = {};
    locals[this.loginKey()] = null;
    return locals;
  }
);

var renderLoginFail = renderGenerator('login',
  function (errors, login) {
    var locals = {errors: errors};
    locals[this.loginKey()] = login;
    return locals;
  }
);

var renderRegister = renderGenerator('register',
  function () {
    var locals = {};
    locals.userParams = {};
    return locals;
  }
);

var renderRegisterFail = renderGenerator('register',
  function (errors, newUserAttributes) {
    return {
        errors: errors
      , userParams: newUserAttributes};
  }
);

/**
 * Let's define our password module
 */
var password = module.exports =
everyModule.submodule('password')
  .configurable({
      loginFormFieldName: 'the name of the login field. Same as what you put in your login form '
               + '- e.g., if <input type="text" name="username" />, then loginFormFieldName '
               + 'should be set to "username".'
    , passwordFormFieldName: 'the name of the login field. Same as what you put in your login form '
               + '- e.g., if <input type="password" name="pswd" />, then passwordFormFieldName '
               + 'should be set to "pswd".'
    , loginHumanName: 'the human readable name of login -- e.g., "login" or "email"'
    , loginKey: 'the name of the login field in your data store -- e.g., "email"; defaults to "login"'
    , loginWith: 'specify what login type you want to use'
    , validLoginTypes: 'specifies the different login types available and associated behavior'
    , loginView: 'Either (A) the name of the view (e.g., "login.jade") or (B) the HTML string ' +
                 'that corresponds to the login page OR (C) a function (errors, login) {...} that returns the HTML string incorporating the array of `errors` messages and the `login` used in the prior attempt'
    , loginLayout: 'the name or path to the layout you want to use for your login'
    , loginLocals: 'Configure extra locals to pass to your login view'
    , loginSuccessRedirect: 'The path we redirect to after a successful login.'
    , registerView: 'Either the name of the view (e.g., "register.jade") or the HTML string ' +
                 'that corresponds to the register page.'
    , registerLayout: 'the name or path to the layout you want to use for your registration page'
    , registerLocals: 'Configure extra locals to pass to your register/registration view'
    , registerSuccessRedirect: 'The path we redirect to after a successful registration.'
  })
  .loginFormFieldName('login')
  .passwordFormFieldName('password')
  .loginHumanName('login')
  .loginKey('login')

  .get('getLoginPath', "the login page's uri path.")
    .step('displayLogin')
      .accepts('req res next')
      .promises(null)
  .displayLogin(renderLogin)

  .post('postLoginPath', "the uri path that the login POSTs to. Same as the 'action' field of the login <form />.")
    .step('extractLoginPassword')
      .accepts('req res next')
      .promises('login password')
    .step('authenticate')
      .accepts('login password')
      .promises('userOrErrors')
    .step('interpretUserOrErrors')
      .description('Pipes the output of the step `authenticate` into either the `user` or `errors` param')
      .accepts('userOrErrors')
      .promises('user errors')
    .step('getSession')
      .description('Retrieves the session of the incoming request and returns in')
      .accepts('req')
      .promises('session')
    .step('addToSession')
      .description('Adds the user to the session')
      .accepts('session user errors')
      .promises(null)
    .step('respondToLoginSucceed') // TODO Rename to maybeRespondToLoginSucceed ?
      .description('Execute a HTTP response for a successful login')
      .accepts('res user')
      .promises(null)
    .step('respondToLoginFail')
      .description('Execute a HTTP response for a failed login')
      .accepts('req res errors login')
      .promises(null)
  .extractLoginPassword( function (req, res) {
    return [req.body[this.loginFormFieldName()], req.body[this.passwordFormFieldName()]];
  })
  .interpretUserOrErrors( function (userOrErrors) {
    if (Array.isArray(userOrErrors)) {
      return [null, userOrErrors]; // We have an array of errors
    } else {
      return [userOrErrors, []]; // We have a user
    }
  })
  .getSession( function (req) {
    return req.session;
  })
  .addToSession( function (sess, user, errors) {
    var _auth = sess.auth || (sess.auth = {});
    if (user)
      _auth.userId = user[this._userPkey];
    _auth.loggedIn = !!user;
  })
  .respondToLoginSucceed( function (res, user) {
    if (user) {
      this.redirect(res, this.loginSuccessRedirect());
    }
  })
  .respondToLoginFail( function (req, res, errors, login) {
    if (!errors || !errors.length) return;
    return renderLoginFail.apply(this, arguments);
  })

  .get('getRegisterPath', "the registration page's uri path.")
    .step('displayRegister')
      .accepts('req res next')
      .promises(null)
  .displayRegister( function (req, res) {
    return renderRegister.apply(this, arguments);
  })

  .post('postRegisterPath', "the uri path that the registration POSTs to. Same as the 'action' field of the registration <form />.")
    .step('extractLoginPassword') // Re-used (/search for other occurence)
    .step('extractExtraRegistrationParams')
      .description('Extracts additonal query or body params from the ' + 
                   'incoming request and returns them in the `extraParams` object')
      .accepts('req')
      .promises('extraParams')
    .step('aggregateParams')
      .description('Combines login, password, and extraParams into a newUserAttributes Object containing everything in extraParams plus login and password key/value pairs')
      .accepts('login password extraParams')
      .promises('newUserAttributes')
    .step('validateRegistrationBase')
      .description("Basic validation done by `everyauth`. Don't edit this. Configure validateRegistration instead.")
      .accepts('newUserAttributes')
      .promises('baseErrors')
    .step('validateRegistration')
      .description('Validates the registration parameters. Default includes check for existing user')
      .accepts('newUserAttributes baseErrors')
      .promises('errors')
    .step('maybeBreakToRegistrationFailSteps')
      .accepts('req res errors newUserAttributes')
      .promises(null)
      .canBreakTo('registrationFailSteps')
    .step('registerUser')
      .description('Creates and returns a new user with newUserAttributes')
      .accepts('newUserAttributes')
      .promises('userOrErrors')
    .step('extractUserOrHandleErrors') // User registration may throw an error if DB detects a non-unique value for login
      .accepts('req res userOrErrors newUserAttributes')
      .promises('user')
      .canBreakTo('registrationFailSteps')
    .step('getSession')
    .step('addToSession')
    .step('respondToRegistrationSucceed')
      .accepts('req res user')
      .promises(null)
  .extractExtraRegistrationParams( function (req) {
    return {};
  })
  .aggregateParams( function (login, password, extraParams) {
    var params = extraParams;
    params[this.loginKey()] = login;
    params.password = password;
    return params;
  })
  .validateRegistrationBase( function (newUserAttributes) {
    var loginWith = this.loginWith()
      , loginWithSpec, loginWithSanitize, loginWithValidate
      , login = newUserAttributes[this.loginKey()]
      , password = newUserAttributes.password
      , errors = [];
    if (!login) {
      errors.push('Missing ' + this.loginHumanName());
    } else {
      // loginWith specific validations
      var validLoginTypes = this.validLoginTypes();
      loginWithSpec = this.validLoginTypes()[loginWith];

      // Sanitize first
      loginWithSanitize = loginWithSpec.sanitize;
      if (loginWithSanitize) {
        login = loginWithSanitize(login);
      }

      // Validate second
      var validateLoginWith = loginWithSpec.validate;
      if (validateLoginWith) {
        if (!validateLoginWith(login)) {
          // Add error third
          errors.push(loginWithSpec.error);
        }
      }
    }
    if (!password) errors.push('Missing password');
    return errors;
  })
  .validateRegistration( function (newUserAttributes, baseErrors) {
    return baseErrors;
  })
  .maybeBreakToRegistrationFailSteps( function (req, res, errors, newUserAttributes) {
    var user, loginField, loginKey;
    if (errors && errors.length) {
      user = newUserAttributes;
      loginField = this.loginFormFieldName();
      loginKey = this.loginKey();
      if (loginField !== loginKey) {
        user[loginField] = user[loginKey];
        delete user[this.loginKey()];
      }
      delete user.password;
      return this.breakTo('registrationFailSteps', req, res, errors, user);
    }
  })
  .extractUserOrHandleErrors( function (req, res, userOrErrors, newUserAttributes) {
    var errors, user;
    if (Array.isArray(userOrErrors)) {
      errors = userOrErrors;
      user = newUserAttributes;
      delete user.password;
      return this.breakTo('registrationFailSteps', req, res, errors, user);
    }
    user = userOrErrors;
    return user;
  })
  .respondToRegistrationSucceed( function (req, res, user) {
    this.redirect(res, this.registerSuccessRedirect());
  })

  .stepseq('registrationFailSteps')
    .step('respondToRegistrationFail')
      .accepts('req res errors newUserAttributes')
      .promises(null)
  .respondToRegistrationFail( function (req, res, errors, newUserAttributes) {
    return renderRegisterFail.apply(this, arguments);
  });

function validateEmail (value) {
  // From Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
  var isValid = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value);

  return isValid;
}

password.validLoginTypes({
    login: {}
  , email: {
        validate: validateEmail
      , error: 'Please correct your email.'
    }
  , phone: {
        sanitize: function (value) {
          // Pull out only +, digits and 'x' for extension
          return value.replace(/[^\+\dx]/g, '');
        }
      , validate: function (value) {
          return value.length >= 7;
        }
      , error: 'Please correct your phone.'
    }
});

password.loginWith = function (loginType) {
  if (!arguments.length) return this._loginType;

  this._loginType = loginType;
  var name
    , validLoginTypes = Object.keys(this.validLoginTypes());
  if (-1 === validLoginTypes.indexOf(loginType)) {
    throw new Error("loginWith only supports " + validLoginTypes.join(', '));
  }
  this.loginFormFieldName(loginType);
  this.loginKey(loginType);
  this.loginHumanName(loginType);
  return this;
};
password.loginWith('login');

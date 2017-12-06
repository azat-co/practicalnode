
/*
 * GET users listing.
 */

exports.list = (req, res) => {
  res.send('respond with a resource')
}

/*
 * GET login page.
 */

exports.login = (req, res, next) => {
  res.render('login')
}

/*
 * GET logout route.
 */

exports.logout = (req, res, next) => {
  req.session.destroy()
  res.redirect('/')
}

/*
 * POST authenticate route.
 */

exports.authenticate = (req, res, next) => {
  if (!req.body.email || !req.body.password) { 
    return res.render('login', {error: 'Please enter your email and password.'}) 
  }
  req.models.User.findOne({
    email: req.body.email,
    password: req.body.password
  }, function (error, user) {
    if (error) return next(error)
    if (!user) return res.render('login', {error: 'Incorrect email&password combination.'})
    req.session.user = user
    req.session.admin = user.admin
    res.redirect('/admin')
  })
}

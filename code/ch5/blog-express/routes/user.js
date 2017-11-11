
/*
 * GET users listing.
 */

exports.list = (req, res, next) => {
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
  res.redirect('/')
}

/*
 * POST authenticate route.
 */

exports.authenticate = (req, res, next) => {
  res.redirect('/admin')
}

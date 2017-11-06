exports.article = require('./article')
exports.user = require('./user')

/*
 * GET home page.
 */

exports.index = (req, res, next) => {
  req.models.Article.find(
    {published: true},
    null,
    {sort: {_id: -1}},
    (error, articles) => {
      if (error) return next(error)
      res.render('index', {articles: articles})
    }
  )
}

exports.article = require('./article')
exports.user = require('./user')

/*
 * GET home page.
 */

exports.index = (req, res, next) => {
  req.collections.articles
    .find({published: true}, {sort: {_id: -1}})
    .toArray((error, articles) => {
      if (error) return next(error)
      res.render('index', {articles: articles})
  })
}
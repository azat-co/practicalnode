
/*
 * GET article page.
 */

exports.show = function(req, res, next) {
  if (!req.params.slug) return next(new Error('No article slug.'));
  req.models.Article.findOne({slug: req.params.slug}, function(error, article) {
    if (error) return next(error);
    if (!article.published && !req.session.admin) return res.send(401);
    res.render('article', article);
  });
};


/*
 * GET articles API.
 */

exports.list = function(req, res, next) {
  req.models.Article.list(function(error, articles) {
    if (error) return next(error);
    res.send({articles: articles});
  });
};


/*
 * POST article API.
 */

exports.add = function(req, res, next) {
  if (!req.body.article) return next(new Error('No article payload.'));
  var article = req.body.article;
  article.published = false;
  req.models.Article.create(article, function(error, articleResponse) {
    if (error) return next(error);
    res.send(articleResponse);
  });
};


/*
 * PUT article API.
 */

exports.edit = function(req, res, next) {
  if (!req.params.id) return next(new Error('No article ID.'));
  req.models.Article.findById(req.params.id, function(error, article) {
    if (error) return next(error);
    article.update({$set: req.body.article}, function(error, count, raw){
      if (error) return next(error);
      res.send({affectedCount: count});
    })
  });
  // req.models.Article.findByIdAndUpdate(req.params.id, {$set: req.body.article}, function(error, doc) {
    // if (error) return next(error);
    // res.send(doc);
  // });
};

/*
 * DELETE article API.
 */

exports.del = function(req, res, next) {
  if (!req.params.id) return next(new Error('No article ID.'));
  req.models.Article.findById(req.params.id, function(error, article) {
    if (error) return next(error);
    if (!article) return next(new Error('article not found'));
    article.remove(function(error, doc){
      if (error) return next(error);
      res.send(doc);
    });
  });
  // req.models.Article.findByIdAndRemove(req.params.id, function(error, doc) {
    // if (error) return next(error);
    // res.send(doc);
  // });
};


/*
 * GET article POST page.
 */

exports.post = function(req, res, next) {
  if (!req.body.title)
  res.render('post');
};



/*
 * POST article POST page.
 */

exports.postArticle = function(req, res, next) {
  if (!req.body.title || !req.body.slug || !req.body.text ) {
    return res.render('post', {error: 'Fill title, slug and text.'});
  }
  var article = {
    title: req.body.title,
    slug: req.body.slug,
    text: req.body.text,
    published: false
  };
  req.models.Article.create(article, function(error, articleResponse) {
    if (error) return next(error);
    res.render('post', {error: 'Artical was added. Publish it on Admin page.'});
  });
};



/*
 * GET admin page.
 */

exports.admin = function(req, res, next) {
  req.models.Article.list(function(error, articles) {
    if (error) return next(error);
    res.render('admin',{articles:articles});
  });

}
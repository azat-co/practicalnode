const express = require('express'),
  cons = require('consolidate')
  path = require('path')

let  app = express()

app.engine('html', cons.swig)

app.set('view engine', 'html')
app.set('views', path.join(__dirname, 'templates'))

var platforms = [
  { name: 'node' },
  { name: 'ruby' },
  { name: 'python' }
]

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Consolidate This'
  })
})

app.get('/platforms', (req, res) => {
  res.render('platforms', {
    title: 'Platforms',
    platforms: platforms
  })
})

app.listen(3000, () => {
  console.log('Express server listening on port 3000')
})
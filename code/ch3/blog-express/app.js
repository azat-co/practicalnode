const express = require('express')

const http = require('http')
const path = require('path')

const app = express()

app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.all('*', (req, res) => {
  res.render('index', {msg: 'Welcome to the Practical Node.js!'})
})

// http.createServer(app).listen(app.get('port'), () => {
  // console.log('Express server listening on port ' + app.get('port'))
// })

const server = http.createServer(app)
const boot = () => {
  server.listen(app.get('port'), () => {
    console.info(`Express server listening on port ${app.get('port')}`)
  })
}
const shutdown = () => {
  server.close()
}
if (require.main === module) {
  boot()
} else {
  console.info('Running app as a module')
  exports.boot = boot
  exports.shutdown = shutdown
  exports.port = app.get('port')
}
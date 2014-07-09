var replify = require('../')
  , app = require('http').createServer()
  , replpad

try {
  replpad = require('replpad');
} catch (e) {
  console.error('For this example you need to `npm install replpad` first.')
  process.exit(1)
}

replify({ name: 'replpad-101', start: replpad }, app)

app.on('request', function onRequest(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.end('Hello, replpad!\n')
})

app.on('listening', function onListening() {
  console.log('listening')
})

app.listen(8080)

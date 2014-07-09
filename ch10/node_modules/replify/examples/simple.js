var replify = require('../')
  , app = require('http').createServer()

replify('realtime-101', app)

app.on('request', function onRequest(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.end('Hello, replify!\n')
})

app.listen(Number(process.argv[2]) || 8080)

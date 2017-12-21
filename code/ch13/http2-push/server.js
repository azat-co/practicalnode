const http2 = require('http2')
const fs = require('fs')

const server = http2.createSecureServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
})

server.on('error', (err) => console.error(err))
server.on('socketError', (err) => console.error(err))

server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  })
  stream.pushStream({ ':path': '/myfakefile.js' }, (pushStream) => {
    pushStream.respond({ 
      'content-type': 'text/javascript',
      ':status': 200 
    })
    pushStream.end(`alert('you win')`)
  })
  stream.end('<script src="/myfakefile.js"></script><h1>Hello World</h1>')
})

server.listen(3000)


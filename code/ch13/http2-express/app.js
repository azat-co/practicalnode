const http2 = require('http2')
const fs = require('fs')
const express = require('express')

const app = express()
app.get('/', (req, res)=>{
  console.log('here')
  res.set('content-type', 'text/html')
  res.status(200).send('<h1>Hello World</h1>')
})
const server = http2.createSecureServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
}, app)

// server.on('error', (err) => console.error(err))
// server.on('socketError', (err) => console.error(err))

server.listen(3000)
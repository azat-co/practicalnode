const koa = require('koa')
const app = new koa()
app.use(function *(next){
  var start = new Date
  yield next
  var ms = new Date - start
  console.log('%s %s - %s', this.method, this.url, ms)
})
app.use(function *(){
  this.body = 'Hello World'
})

app.listen(3000)
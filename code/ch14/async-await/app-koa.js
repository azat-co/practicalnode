const axios = require('axios')
const Koa = require('koa')
const app = new Koa()

app.use(async ctx => {
  const response = await axios.get('http://azat.co')
  ctx.body = response.data
})

app.listen(3000)
const express = require('express')
const mongoskin = require('mongoskin')
const bodyParser = require('body-parser')
const logger = require('morgan')
const http = require('http')

const app = express()

app.set('port', process.env.PORT || 3000)


app.use(bodyParser.json())
app.use(logger())

var db = mongoskin.db('mongodb://@localhost:27017/test', {safe:true})
var id = mongoskin.helper.toObjectID

app.param('collectionName', function(req, res, next, collectionName){
  req.collection = db.collection(collectionName)
  return next()
})

app.get('/', function(req, res, next) {
  res.send('Select a collection, e.g., /collections/messages')
})

app.get('/collections/:collectionName', function(req, res, next) {
  req.collection.find({}, {limit: 10, sort: [['_id', -1]]})
    .toArray(function(e, results){
      if (e) return next(e)
      res.send(results)
    }
  )
})

app.post('/collections/:collectionName', function(req, res, next) {
  req.collection.insert(req.body, {}, function(e, results){
    if (e) return next(e)
    res.send(results.ops)
  })
})

app.get('/collections/:collectionName/:id', function(req, res, next) {
  req.collection.findOne({_id: id(req.params.id)}, function(e, result){
    if (e) return next(e)
    res.send(result)
  })
})

app.put('/collections/:collectionName/:id', function(req, res, next) {
  req.collection.update({_id: id(req.params.id)},
    {$set: req.body},
    {safe: true, multi: false}, function(e, result){
    if (e) return next(e)
    res.send((result.result.n === 1) ? {msg:'success'} : {msg:'error'})
  })
})

app.delete('/collections/:collectionName/:id', function(req, res, next) {
  req.collection.remove({_id: id(req.params.id)}, function(e, result){
    if (e) return next(e)
    // console.log(result)
    res.send((result.result.n === 1) ? {msg:'success'} : {msg:'error'})
  })
})

const server = http.createServer(app)
const boot = () => {
  server.listen(app.get('port'), () => {
    console.info(`Express server listening on port ${app.get('port')}`)
  })
}

const shutdown = function () {
  server.close(process.exit)
}

if (require.main === module) {
  boot()
} else {
  console.info('Running app as a module')
  exports.boot = boot
  exports.shutdown = shutdown
  exports.port = app.get('port')
}

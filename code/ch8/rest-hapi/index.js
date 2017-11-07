const port = process.env.PORT || 3000

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({ port: port, host: 'localhost' });

const mongoskin = require('mongoskin')

var db = mongoskin.db('mongodb://@localhost:27017/test', {})
var id = mongoskin.helper.toObjectID

var loadCollection = function(name, callback) {
  callback(db.collection(name))
}

server.route([
  {
    method: 'GET',
    path: '/',
    handler: function(req, reply) {
      reply('Select a collection, e.g., /collections/messages')
    }
  },
    {
    method: 'GET',
    path: '/collections/{collectionName}',
    handler: function(req, reply) {
      loadCollection(req.params.collectionName, function(collection) {
        collection.find({}, {limit: 10, sort: [['_id', -1]]}).toArray(function(e, results){
          if (e) return reply(e)
          reply(results)
        })
      })
    }
  },
    {
    method: 'POST',
    path: '/collections/{collectionName}',
    handler: function(req, reply) {
      loadCollection(req.params.collectionName, function(collection) {
        collection.insert(req.payload, {}, function(e, results){
          if (e) return reply(e)
          reply(results.ops)
        })
      })
    }
  },
    {
    method: 'GET',
    path: '/collections/{collectionName}/{id}',
    handler: function(req, reply) {
      loadCollection(req.params.collectionName, function(collection) {
        collection.findOne({_id: id(req.params.id)}, function(e, result){
          if (e) return reply(e)
          reply(result)
        })
      })
    }
  },
    {
    method: 'PUT',
    path: '/collections/{collectionName}/{id}',
    handler: function(req, reply) {
      loadCollection(req.params.collectionName, function(collection) {
        collection.update({_id: id(req.params.id)},
          {$set: req.payload},
          {safe: true, multi: false}, function(e, result){
          if (e) return reply(e)
          reply((result.result.n === 1) ? {msg:'success'} : {msg:'error'})
        })
      })
    }
  },
    {
    method: 'DELETE',
    path: '/collections/{collectionName}/{id}',
    handler: function(req, reply) {
      loadCollection(req.params.collectionName, function(collection) {
        collection.remove({_id: id(req.params.id)}, function(e, result){
           if (e) return reply(e)
           reply((result.result.n === 1) ? {msg:'success'} : {msg:'error'})
         })
      })
    }
  }
])


var options = {
  subscribers: {
    'console': ['ops', 'request', 'log', 'error']
  }
};

server.register(require('good', options, function (err) {
  if (!err) {
      // Plugin loaded successfully
  }
}))


const boot = () => {
  server.start((err) => {    
    if (err) {
      process.exit(1)
    }
    console.log(`Server running at: ${server.info.uri}`)
  })    
}

const shutdown = () => {
  server.stop({}, ()=>{
    process.exit(0)
  })
}

if (require.main === module) {
  console.info('Running app as a standalone')
  boot()
} else {
  console.info('Running app as a module')
  exports.boot = boot
  exports.shutdown = shutdown
  exports.port = port
}
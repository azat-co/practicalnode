const port = process.env.PORT || 3000
const Hapi = require('hapi')
server.connection({ port: port, host: 'localhost' })
const server = new Hapi.Server()

const mongoskin = require('mongoskin')

const db = mongoskin.db('mongodb://@localhost:27017/test', {})
const id = mongoskin.helper.toObjectID

const loadCollection = (name, callback) => {
  callback(db.collection(name))
}

server.route([
  {
    method: 'GET',
    path: '/',
    handler: (req, reply) => {
      reply('Select a collection, e.g., /collections/messages')
    }
  },
  {
    method: 'GET',
    path: '/collections/{collectionName}',
    handler: (req, reply) => {
      loadCollection(req.params.collectionName, (collection) => {
        collection.find({}, {limit: 10, sort: [['_id', -1]]}).toArray(function (e, results) {
          if (e) return reply(e)
          reply(results)
        })
      })
    }
  },
  {
    method: 'POST',
    path: '/collections/{collectionName}',
    handler: (req, reply) => {
      loadCollection(req.params.collectionName, (collection) => {
        collection.insert(req.payload, {}, function (e, results) {
          if (e) return reply(e)
          reply(results.ops)
        })
      })
    }
  },
  {
    method: 'GET',
    path: '/collections/{collectionName}/{id}',
    handler: (req, reply) => {
      loadCollection(req.params.collectionName, (collection) => {
        collection.findOne({_id: id(req.params.id)}, (e, result) => {
          if (e) return reply(e)
          reply(result)
        })
      })
    }
  },
  {
    method: 'PUT',
    path: '/collections/{collectionName}/{id}',
    handler: (req, reply) => {
      loadCollection(req.params.collectionName, (collection) => {
        collection.update({_id: id(req.params.id)},
          {$set: req.payload},
          {safe: true, multi: false}, (e, result) => {
            if (e) return reply(e)
            reply((result.result.n === 1) ? {msg: 'success'} : {msg: 'error'})
          })
      })
    }
  },
  {
    method: 'DELETE',
    path: '/collections/{collectionName}/{id}',
    handler: (req, reply) => {
      loadCollection(req.params.collectionName, (collection) => {
        collection.remove({_id: id(req.params.id)}, (e, result) => {
          if (e) return reply(e)
          reply((result.result.n === 1) ? {msg: 'success'} : {msg: 'error'})
        })
      })
    }
  }
])

const options = {
  subscribers: {
    'console': ['ops', 'request', 'log', 'error']
  }
}

server.register(require('good', options, (err) => {
  if (!err) {
      // Plugin loaded successfully
  }
}))

const boot = () => {
  server.start((err) => {
    if (err) {
      console.error(err)
      return process.exit(1)
    }
    console.log(`Server running at: ${server.info.uri}`)
  })
}

const shutdown = () => {
  server.stop({}, () => {
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

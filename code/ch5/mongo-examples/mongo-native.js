const mongo = require('mongodb')
const dbHost = '127.0.0.1'
const dbPort = 27017

const {Db, Server} = mongo
const db = new Db('local', new Server(dbHost, dbPort), {safe: true})

db.open((error, dbConnection) => {
  if (error) {
    console.error(error)
    process.exit(1)
  }
  console.log('db state: ', db._state)
  dbConnection.collection('messages').findOne({}, (error, item) => {
    if (error) {
      console.error(error)
      process.exit(1)
    }
    console.info('findOne: ', item)
    item.text = 'hi'
    var id = item._id.toString() // we can store ID in a string
    console.info('before saving: ', item)
    dbConnection
      .collection('messages')
      .save(item, (error, document) => {
        if (error) {
          console.error(error)
          return process.exit(1)
        }
        console.info('save: ', document)
        dbConnection.collection('messages')
          .find({_id: new mongo.ObjectID(id)})
          .toArray((error, documents) => {
            if (error) {
              console.error(error)
              return process.exit(1)
            }
            console.info('find: ', documents)
            db.close()
            process.exit(0)
          }
        )
    })
  })
})

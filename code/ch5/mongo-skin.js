const mongoskin = require('mongoskin')
const dbHost = '127.0.0.1'
const dbPort = 27017

var db = mongoskin.db(`${dbHost}:${dbPort}/local`, {safe: true})

db.bind('messages', {
  findOneAndAddText: function (text, fn) {
    db.collection('messages').findOne({}, (error, item) => {
      if (error) {
        console.error(error)
        return process.exit(1)
      }
      console.info('findOne: ', item)
      item.text = text
      var id = item._id.toString() // we can store ID in a string
      console.info('before saving: ', item)
      db.collection('messages').save(item, (error, count) => {
        if (error) {
          console.error(error)
          return process.exit(1)
        }
        console.info('save: ', count)
        return fn(count, id)
      })
    })
  }
})

db.collection('messages').findOneAndAddText('hi', (count, id) => {
  db.collection('messages').find({
    _id: db.collection('messages').id(id)
  }).toArray((error, items) => {
    if (error) {
      console.error(error)
      return process.exit(1)
    }
    console.info('find: ', items)
    db.close()
    process.exit(0)
  })
})

const mongoskin = require('mongoskin')
const { toObjectID } = mongoskin.helper
const dbHost = '127.0.0.1'
const dbPort = 27017

var db = mongoskin.db(`mongodb://${dbHost}:${dbPort}/local`, {safe: true})

db.bind('messages').bind({
  findOneAndAddText: function (text, fn) { // no fat arrow fn because we need to let bind pass the collection to use this on the next line... this can be replaced with db.messages too
    this.findOne({}, (error, document) => {
      if (error) {
        console.error(error)
        return process.exit(1)
      }
      console.info('findOne: ', document)
      document.text = text
      var id = document._id.toString() // we can store ID in a string
      console.info('before saving: ', document)
      this.save(document, (error, count) => {
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

db.messages.findOneAndAddText('hi', (count, id) => {
  db.messages.find({
    _id: toObjectID(id)
  }).toArray((error, documents) => {
    if (error) {
      console.error(error)
      return process.exit(1)
    }
    console.info('find: ', documents)
    db.close()
    process.exit(0)
  })
})

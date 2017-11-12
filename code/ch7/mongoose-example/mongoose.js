const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/test', {useMongoClient: true})
mongoose.Promise = global.Promise
const Book = mongoose.model('Book', { name: String })

const practicalNodeBook = new Book({ name: 'Practical Node.js' })
practicalNodeBook.save((err, results) => {
  if (err) {
    console.error(err)
    process.exit(1)
  } else {
    console.log('Saved: ', results)
    process.exit(0)
  }
})

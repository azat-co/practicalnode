const mongodb= require('mongodb')
const url = 'mongodb://localhost:27017'
const customers = require('./customer_data.json')
const async = require('async')

const finalCallback = (results)=>{
  console.log(results)
  process.exit(0)
}

let tasks = []
const limit = customers.length

mongodb.MongoClient.connect(url, (error, dbServer) => {
  if (error) return console.log(error)
  const db = dbServer.db('cryptoexchange')
  for (let i=0; i<limit; i++) {    
    tasks.push((done) => {
      db.collection('customers').insert(customers[i], (error, results) => {
        done(error, results)
      })
    })
  }
  async.parallel(tasks, (errors, results) => {
    if (errors) console.error(errors)
    finalCallback(results)
  })
})


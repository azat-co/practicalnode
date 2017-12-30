const mongodb= require('mongodb')
const url = 'mongodb://localhost:27017'
const customers = require('./customer_data.json')

const finalCallback = (results)=>{
  console.log(results)
  process.exit(0)
}

let tasksCompleted = 0
const limit = customers.length

mongodb.MongoClient.connect(url, (error, dbServer) => {
  if (error) return console.log(error)
  const db = dbServer.db('cryptoexchange')
  for (let i=0; i<limit; i++) {    
    db.collection('customers')
      .insert(customers[i], (error, results) => {
        tasksCompleted++
        if (tasksCompleted === limit) return finalCallback(`Finished ${tasksCompleted} insertions for DB migration`)
    })
  }
})
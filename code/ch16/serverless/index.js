'use strict'

console.log('Loading function')
const doc = require('dynamodb-doc')
const dynamo = new doc.DynamoDB()

// All the request info in event
// "handler" is defined on the function creation
exports.handler = (event, context, callback) => {
    // Callback to finish response
  const done = (err, res) => callback(null, {
    statusCode: err ? '400' : '200',
    body: err ? err.message : JSON.stringify(res),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    // To support mock testing, accept object not just strings
  if (typeof event.body === 'string') { event.body = JSON.parse(event.body) }
  switch (event.httpMethod) {
        // Table name and key are in payload
    case 'DELETE':
      dynamo.deleteItem(event.body, done)
      break
        // No payload, just a query string param
    case 'GET':
      dynamo.scan({ TableName: event.queryStringParameters.TableName }, done)
      break
        // Table name and key are in payload
    case 'POST':
      dynamo.putItem(event.body, done)
      break
        // Table name and key are in payload
    case 'PUT':
      dynamo.updateItem(event.body, done)
      break
    default:
      done(new Error(`Unsupported method "${event.httpMethod}"`))
  }
}

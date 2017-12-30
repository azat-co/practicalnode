Chapter 14
----------
# Asynchronous Code in Node

Asynchronous code is at the heart of Node because it allows developers to build non-blocking I/O system which are more performant than traditional blocking system for the reason that non-blocking I/O systems use the waiting time and delegate by create parallel executions. 

Historically Node developers were able to use only callbacks and event emitters (observer pattern in Node). However, in recent years, front-end developers and ECMAScript push onto Node developers (for better or worth) a few asynchronous styles. They allow for a different syntax. They are:

* `async` module
* Promises
* Async/await functions

My favorite is async functions so if you want to just jump straight to that, do so, but I will still cover others albeit briefly to show that async functions are better. :)


Here's a teaser for you. This code works meaning try/catch will prevent the app from burning:

```js
try {
  JSON.parse('not valid json for sure')
} catch (e) {
  console.error(e)
}
```

Now what about this async code with setTimeout which mimicks an IO operation?

```js
try {
  setTimeout(()=>JSON.parse('not valid json for sure'), 0)
} catch (e) {
  console.error('nice message you will never see')
}
```

Can you guess? The `try/catch` is useless in async code! That's because mighty event loop separates the callback code in an I/O method. When that callback fires, it is lost all the memory of a try/catch. Argh.

The solution is to use the `error` argument and process it by having an if/else. That's for pure callbacks. There are other approaches as well.


# `async` Module

A common scenarios is to run multiple tasks at once. Let's say you are migrating a database and you need to insert bunch of records into a database from a JSON file. Each record is independent of one another so why not send many of them at once so they run in parallel? It might be a good idea to do so.

Node allows us to write parallel tasks. Here's a simple code which connect to a database and then uses a counter to finish up the loading:

```js
const mongodb= require('mongodb')
const url = 'mongodb://localhost:27017'
const customers = require('./customer_data.json')

const finalCallback = (results)=>{
  console.log(results)
  process.exit(0)
}

let tasksCompleted = 0
const limit = 1000

mongodb.MongoClient.connect(url, (error, dbServer) => {
  if (error) return console.log(error)
  const db = dbServer.db('cryptoexchange')
  for (let i=0; i<limit; i++) {    
    db.collection('customers')
      .insert(customers[i], (error, results) => {
        // Just a single insertion, not 1000 of them
    })
  }
})
// Putting finalCallback() here would NOT help
```

But how do we know when everything is done because you often need to continue to execute some other code dependent upon the completion of ALL the tasks such as these 1000 MongoDB insertions? Where to put `finalCallback()`? You can have a counter. It's a rude approach but it works (file `code/ch14/async/parallel.js`).

```js
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
```

It's not very elegant to have this counter and also, how do you know if one or two out of the 1000 of the tasks have failed? That's why there's the `async` library. It solve the problem of running and error handling of parallel tasks, but not just them. It also has methods for sequential, and many other types of asynchronous execution. Another benefit of the `async` module's parallel method is that developers can pass the results of every individual task to the main final callback. Try that with the counter!

Here's the same database migration script but re-written with the `async` module (file `code/ch14/async-example/parallel-async.js`):

```js
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
```

There are more methods in `async` than just `parallel()`. There are methods to execute tasks sequentially, with racing, with queue, with limits, with retries and tons of other ways. Almost all of them support multiple error and result object in the final callback which is a huge plus. For up-to-date `async` API, see the docs at <https://caolan.github.io/async>.

# Promises

Promises use `then`. They use `catch` sometimes too. That's how you can spot them. That's how you can use them. As a Node developer, you will be using other people's promises a lot. They'll be coming from libraries such as axios or mocha. 

In a rare case when you can find a promise-based library on npm in 2018, then you will have to write your own promise. There's a global `Promise` which is available in all and every Node program. This global `Promise` will help you to create your own promise. 

Thus, let's cover how to use promises and then how to create them. We start with usage since most of you will never be in need to write your own promise (especially when you finish this chapter and learn about better syntax such as async functions).

To use a promise, simple define `then` and put some code into it:

```js
const axios = require('axios')
axios.get('http://azat.co')
  .then((response)=>response.data)
  .then(html => console.log(html))
```

You can chain and pass around data as much as you want. Try to avoid using nested callback inside of `then`. Instead, return a value and create a new `then`.
When you get tired of writing `then`, consider writing one or more `catch` statements. For example, using `https://azat.co` will lead to an error because I don't have an SSL certificate on that domain:

```
Error: Hostname/IP doesn't match certificate's altnames: "Host: azat.co. is not in the cert's altnames: DNS:*.github.com, DNS:github.com, DNS:*.github.io, DNS:github.io"
```

Coming from this code:

```js
axios.get('https://azat.co')
  .then((response)=>response.data)
  .then(html => console.log(html))
  .catch(e=>console.error(e))
```

Next topic is creation of promises. Just call `new Promise` and use either `resolve` or `reject` callback (yes, callback in promises). For example, the `fs.readFile()` is a callback-based function. It's good and familiar. Let's make an ugly promise out of that. Also, let's parse JSON with try/catch because why not? In a promise it's okay to use try/catch.

```js
const fs = require('fs')
function readJSON(filename, enc='utf8'){
  return new Promise(function (resolve, reject){
    fs.readFile(filename, enc, function (err, res){
      if (err) reject(err)
      else {
        try {
          resolve(JSON.parse(res))
        } catch (ex) {
          reject(ex)
        }
      }
    })
  })
}

readJSON('./package.json').then(console.log)
```

There are more feature in `Promise` such as `all`, `race`, and error handling. I will skip all of that because you can read about them in [the docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), async functions are better, and because I don't like promises.


Now that you know how to use a promise from a library (such as `axios`) and create a promise from the ES6 standard promise, I want to show you how a basic promise implementation works under the hood. You will smile and be pleasantly surprised that promise is nothing more that some tiny bitty JavaScript code around callback. Yes, callbacks. Promises are not replacement for callbacks, they work together. 

All know the `setTimeout()` method. It works similarly to any other async method such as `fs.readFile()` or `superagent.get()`. You have normal argument(s) such as string, number, object, and other boring static data, and you have callbacks with are not normal argument but functions (dynamic and lively, thus more interesting). You would create a new async function `myAsyncTimeoutFn` with your own callback. So when you call your this new function, it calls timeout with the callback and after 1000ms the callback is executed (file `code/ch14/promise/basic-promise-1.js`).

```js
function myAsyncTimeoutFn(data, callback) {
  setTimeout(() => {
    callback()
  }, 1000)
}

myAsyncTimeoutFn('just a silly string argument', () => {
  console.log('Final callback is here')
})
```

What we can do is to re-write the custom timeout function `myAsyncTimeoutFn` to return an object which will have a special method (file `code/ch14/promise/basic-promise-2.js`). This special method will set the callback. This process is called externalization of the callback argument. In other words, our callback won't be passed as an argument to the `myAsyncTimeoutFn` but to a method. Let's call this method `then` because why not. 

```js
function myAsyncTimeoutFn(data) {

  let _callback = null
  setTimeout( () => {
    if ( _callback ) callback()
  }, 1000)
  
  return {
    then(cb){
      _callback = cb
    }
  }

}

myAsyncTimeoutFn('just a silly string argument').then(() => {
  console.log('Final callback is here')
})
```

The code above functions well because our normal `setTimeout` does not actually need `_callback` right now. It needs it only long, long, long one thousand milliseconds in the future. By that time, we executed `then` which sets the value of the `_callback`. Some knowledgeable about OOP engineers might call the callback value a private method and they would be correct. And yes, you actually don't need to prefix the `_callback` with the underscore `_` but that's a good convention in Node which tell other Node developers (at least the good one, like yourself who read this book) that this method is private. See chapter 1 for more syntax conventions like this.

What about errors? Error handling is important in Node, right? We cannot just ignore errors or throw them under the rug (never throw an error). That's easy too because we can add another argument to `then`. Here's an example with the core `fs` module and error handling (file `code/ch14/promise/basic-promise-2.js`).

```js
const fs = require('fs')
function readFilePromise( filename ) {
  let _callback = () => {}
  let _errorCallback = () => {}

  fs.readFile(filename, (error, buffer) => {
    if (error) _errorCallback(error)
    else _callback(buffer)
  })

  return {
    then( cb, errCb ){
      _callback = cb
      _errorCallback = errCb
    }
  }

}

readFilePromise('package.json').then( buffer => {
  console.log( buffer.toString() )
  process.exit(0)
}, err => {
  console.error( err )
  process.exit(1)
})
```

The result of the code above (file `code/ch14/promise/basic-promise-3.js`) will be the content of the package.json file if you run it in my code folder `code/ch14/promise`. But you probably can't wait to see the error handling in action. Let's introduce a typo into the file name which will lead to the `errCb` which is `_errorCallback`. This is the code which breaks the script: 

```js
readFilePromise('package.jsan').then( buffer => {
  console.log( buffer.toString() )
  process.exit(0)
}, err => {
  console.error( err )
  process.exit(1)
})
```

The output is just what we wanted:

```
{ Error: ENOENT: no such file or directory, open 'package.jsan'
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: 'package.jsan' }
```

To summarize our basic promise implementation, we are not using the callback argument on the main function to pass the value, but we are using the callback argument on the `then` method. The callback argument value is a function which is executed later just like with the regular callback pattern. 

Of course standard (ES6 or ES2015) promises have more features. This was just a basic (naive) implementation to show you that promises are simple and mostly about syntax.

I hope this example demystified promises and make them less scary... if not then just use async/await function and you'll be good. The next section is on them.

# Async Functions

In a nutshell, an `async/await` function is just a wrapper for a promise. They are very compatible. The advantage of the `async/await` function is that the syntax is smaller and that `async/await` concept *already exists* in other languages such as C#. 
Let's re-write the code above with async function. The way to do it is to use a word `async` in front of the word function. Then you can use word `await` after that *inside* of the function. This `await` will not block the entire system but it will "pause" the current function to get the asynchronous results from a promise or async function.

```js
const axios = require('axios')
const getAzatsWebsite = async () => {
  const response = await axios.get('http://azat.co')
  return response.data
}
getAzatsWebsite().then(console.log)
```

So async functions and promises are compatible. Developers can resolve async functions with `then`. The difference is that inside of `async` function developers don't need to create a mess of `then` statements or nested callbacks. Take a look at this neat Mocha example from my course [Node Testing](https://node.university/p/node-testing):

```js
const axios = require('axios')
const {expect} = require('chai')
const app = require('../server.js')
const port = 3004

before(async function() {
  await app.listen(port, ()=>{console.log('server is running')})
  console.log('code after the server is running')
})

describe('express rest api server', async () => {
  let id

  it('posts an object', async () => {
    const {data: body} = await axios.post(`http://localhost:${port}/collections/test`, { name: 'John', email: 'john@rpjs.co'})
    expect(body.length).to.eql(1)
    expect(body[0]._id.length).to.eql(24)
    id = body[0]._id
  })

  it('retrieves an object', async () => {
    const {data: body} = await axios.get(`http://localhost:${port}/collections/test/${id}`)
    // console.log(body)
    expect(typeof body).to.eql('object')
    expect(body._id.length).to.eql(24)
    expect(body._id).to.eql(id)
    expect(body.name).to.eql('John')
  })
  // ...
})
```

I hope you appreciate the succinctness of the `async` in the before and it statements. The full source code of this Mocha test with promise and callback versions are on [GitHub](https://github.com/azat-co/node-testing/tree/master/code/rest-test/test).

The gist is that async functions are more awesome when you don't resolve them yourself but use in a framework or a library. Let's see how to use Koa which is a web framework similar to Express but which uses async functions.

Here's a basic example which has a single route (called middleware, remember?) `app.use()`. It take an async function and there's no `next()` callback. You simple set the body on the `ctx` (context) argument. 

```js
const Koa = require('koa')
const app = new Koa()

app.use(async ctx => {
  ctx.body = 'Hello World'
})

app.listen(3000)
```

What's especially nice with this approach in Koa is that you can call other asynchronous methods. For example, here's how you can make a non-blocking request to fetch my website azat.co and then send to the client its HTML as the response.

```js
const Koa = require('koa')
const app = new Koa()

app.use(async ctx => {
  const response = await axios.get('http://azat.co')
  ctx.body = response.data
})

app.listen(3000)
```


Now let's go back full circle to `try/catch`. Remember, we couldn't use `try/catch` to handle asynchronous errors, right? Guess what. It'll work in async/await function. See this:

```js
const axios = require('axios')
const getAzatsWebsite = async () => {
  try {
    const response = await axios.get('https://azat.co')
    return response.data
  } catch(e) {
    console.log('oooops')
  }
}
getAzatsWebsite().then(console.log)
```

The code above will produce `oooops` because my website azat.co is hosted on http, not hosted on https.

Summary
=======

Writing and understanding asynchronous code is hard. It's not your fault if this topic is tough on your mind because most of the Computer Science material teach synchronous code. Also, human brains just not wired evolutionary to deal with parallel and concurrent (my opinion, not a scientific fact AFAIK). 

It doesn't matter if you are new to Node or a seasoned Node developer like I am, you must know how to work and read new asynchronous code with async library promises and async/await function. You might even start writing your code using some of that new syntax. I really like async/await function for their eloquence and compatibility wit ubiquitous promises.

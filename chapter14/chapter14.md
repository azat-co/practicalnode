Chapter 14
----------
# Asynchronous Code in Node

Asynchronous code is at the heart of Node because it allows developers to build non-blocking I/O system which are more performant than traditional blocking system for the reason that non-blocking I/O systems use the waiting time and delegate by create parallel executions. 

Historically Node developers were able to use only callbacks and event emitters (observer pattern in Node). However, in recent years, front-end developers and ECMAScript push onto Node developers (for better or worth) a few asynchronous styles. They allow for a different syntax. They are:

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



# Async Functions

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


Summary
=======

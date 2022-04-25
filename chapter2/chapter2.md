Chapter 2
---------
# Using Express.js to Create Node.js Web Apps

It’s only logical that, by using frameworks, software engineers become more productive and can achieve results faster. Often, the results are of a better quality because the frameworks are used and maintained by many other developers and contributors. Even if developers build everything from scratch, they end up with *their own framework* in the end. It&#39;s just a very customized one!

Node.js is a relatively young platform when it comes to frameworks (unlike Ruby or Java), but there&#39;s already a leader that has become a de facto standard used in the majority of Node.js projects: Express.js.

Express.js is an amazing framework for Node.js projects, and it&#39;s used in the majority of web apps, which is why this second chapter is dedicated to getting started with this framework.

In this chapter we cover the following topics, which serve as an introduction to Express.js:

- What Express.js is
- How Express.js works
- Express.js Installation
- Express.js scaffolding (command-line tool)
- The Blog Project overview
- Express.js Hello World example

# What Is Express.js?

Express.js is a web framework based on the core Node.js `http` module and [Connect](http://www.senchalabs.org/connect) (<http://www.senchalabs.org/connect>) components. The components are called *middleware* and they are the cornerstones of the framework philosophy, which is *configuration over convention*. In other words, Express.js systems are highly configurable, which allows developers to freely pick whatever libraries they need for a particular project. For these reasons, the Express.js framework leads to flexibility and high customization in the development of web applications.

If you write serious Node web apps using only core Node.js modules (refer to the following snippet for an example), you most likely find yourself reinventing the wheel by writing the same code continually over and over for similar boring mundane tasks, such as the following:

- Parsing of HTTP request bodies
- Parsing of cookies
- Getting information from URL
- Reading query string data from URLs or request bodies (payloads)
- Managing web sessions
- Organizing routes with a chain of `if` conditions based on URL paths and HTTP methods of the requests
- Determining proper response headers based on data types

The list could go on and on, but a good example is worth hundreds of words. To illustrate my point, here is an example of a two-route [representational state transfer](http://en.wikipedia.org/wiki/Representational_state_transfer) (REST) API server, i.e., we have only two endpoints and they are also called *routes*. In this application, we use only core Node.js modules for server functions. A single &quot;userland&quot;/external module native MongoDB driver is used for persistence. This example is taken from my another best selling book on Node, beginner-friendly [Full Stack JavaScript, 2nd Edition](https://github.com/azat-co/fullstack-javascript) (<https://github.com/azat-co/fullstack-javascript>) (Apress, 2018). Pay attention to how I had to use if/else and parse the incoming data. 

```js
const http = require('http')
const util = require('util')
const querystring = require('querystring')
const mongo = require('mongodb')

const host = process.env.MONGOHQ_URL ||
    'mongodb://@127.0.0.1:27017'
// MONGOHQ_URL=mongodb://user:pass@server.mongohq.com/db_name
mongo.Db.connect(host, (error, client) => {
  if (error) throw error;
  let collection = new mongo.Collection(
    client,
    'test_collection'
  );
  let app = http.createServer(
    (request, response) => {
      if (
        request.method === 'GET' &&
        request.url === '/messages/list.json'
      ) {
        collection.find().toArray((error, results) => {
          response.writeHead(
            200,
            {'Content-Type': 'text/plain'}
          );
          console.dir(results);
        response.end(JSON.stringify(results));
        });
      };
      if (request.method === "POST" &&
        request.url === "/messages/create.json"
      ) {
        request.on('data', (data) => {
          collection.insert(
            querystring.parse(data.toString('utf-8')),
            {safe: true},
            (error, obj) => {
            if (error) throw error;
            response.end(JSON.stringify(obj));
            }
          );
        });
      };
    }
  );
  const port = process.env.PORT || 5000
  app.listen(port)
})
```

As you can see, developers have to do *a lot* of manual work themselves, such as interpreting HTTP methods and URLs into routes, and parsing input and output data. And I didn't even use URL parameters such as `/message/ID`. Not nice!

Express.js solves these and many other problems as abstraction and code organization. The framework provides a model-view-controller-like (MVC-like) structure for your web apps with a clear separation of concerns (views, routes, models).

For the models (the M in MVC), we can use [Mongoose](http://mongoosejs.com) (<http://mongoosejs.com>) or [Sequelize](http://sequelizejs.com) (<http://sequelizejs.com>) libraries in *addition* to Express.js—more on this later in the book in Chapter 7. In this chapter we&#39;ll cover just the basics of Express.js. This will be enough for you to start building your own small Express apps.

Built on top this framework, Express.js applications can vary from bare-bones, back-end-only REST APIs to full-blown, highly scalable, full-stack (with [jade-browser](https://npmjs.org/package/jade-browser) (<https://npmjs.org/package/jade-browser>) and [Socket.IO](http://socket.io) (<http://socket.io>)) real-time web apps. To give some analogies to developers who are familiar with Ruby and Ruby on Rails, Ruby on Rails is convention over configuration. Other frameworks like Sails and Loopback are more like Ruby's Ruby on Rails framework. Express.js on the other hand is often seen as another Ruby framework Sinatra, which has a very different approach to the Ruby on Rails framework. Express.js and Sinatra promote configurability, whereas Ruby on Rails promotes *convention over configuration*.

Although Express.js is one of the most popular libraries on npm (16 million downloads only for June 2018), and is the most mature and most used Node.js framework, the playing field is still relatively level with many different frameworks, and new ones are released every month. Some of them, such as [Meteor](http://meteor.com) (<http://meteor.com>) and [Hapi](https://www.npmjs.com/package/hapi) (<https://www.npmjs.com/package/hapi>), show an interesting trend in attempts to merge front-end and back-end code bases. For a hand-picked list of Node.js frameworks, refer to the [Node Framework](http://nodeframework.com) (<http://nodeframework.com>) resource.

When evaluating a Node.js framework for your project, use these easy steps to guide you:

- Build a sample app, which is usually provided by the creators of frameworks on GitHub or official web sites. See how the app feels in terms of styles and patterns.
- Consider the type of application you&#39;re building: prototype, production app, minimum viable product (MVP), small scale, large scale, and so on.
- Consider the libraries already familiar to you and determine whether you can or plan to reuse them, and whether your framework plays nicely with them. Provide out-of-the-box solutions: template engines, database object-relational mapping (<http://en.wikipedia.org/wiki/Object-relational_mapping>) libraries (ORMs)/drivers, Cascading Style Sheets (<http://en.wikipedia.org/wiki/Cascading_Style_Sheets>) (CSS) frameworks.
- Consider the nature of your application: REST API (with a separate front-end client), a traditional web app, or a traditional web app with REST API endpoints (such as Blog).
- Consider whether you need the support of reactive templates with WebSocket from the get-go (or use the Meteor framework).
- Evaluate the number of stars and follows on npm and GitHub to judge the popularity of the framework. More popular typically means more blog posts, books, screencasts, tutorials, and programmers exist; less popular means it's a newer framework, a niche/custom choice, or a poor choice. With newer frameworks, there is a greater chance that contributing back to them will be valued, so pick your comfortable spot.
- Evaluate npm, GitHub pages, and a framework&#39;s website for the presence of good API documentation with examples or open issues/bugs. If there are more than a few hundred, depending on popularity, this may not be a good sign. Also, determine the date of the last commit on the GitHub repository. Anything older than six months is not a good sign.

# How Express.js Works

Express.js usually has an entry point, a.k.a., the main file. The names of this file typically are `server.js`, `app.js` or `index.js`. Most of the time, this is the file that we start with the `node` command, or export it as a module, in some cases. And in this file, we do the following:

1. Include third-party dependencies as well as our own modules, such as controllers, utilities, helpers, and models
2. Configure Express.js app settings, such as template engine and its file extensions
3. Connect to databases such as MongoDB, Redis, or MySQL (optional)
4. Define middleware such as error handlers, static file folder, cookies, and other parsers
5. Define routes
6. Start the app
7. Export the app as a module (optional)

When the Express.js app is running, it&#39;s listening to requests. Each incoming request is processed according to a defined chain of middleware and routes, starting from top to bottom. This aspect is important in controlling the execution flow. For example, routes/middleware that are higher in the file have precedence over the lower definitions.

Because we can have multiple middleware functions processing each HTTP request, some of the functions are in the middle (hence the name *middleware*). Here are some examples of middleware purposes:

1. Parse cookie information and put it in `request` object for following middleware/routes.
2. Parse parameters from the URL and put it in `request` object for following middleware/routes.
3. Get the information from the database based on the value of the parameter, if the user is authorized (cookie/session), and put it in `request` object for following middleware/routes.
4. Authorize users/requests (or not).
5. Display the data and end the response.

# Express.js Installation

The Express.js app can be created using two methods:

1. `express-generator`: A global npm package that provides the command-line tool for rapid app creation (scaffolding)—recommended for quick prototyping and server-side rendering (thick server) apps.
2. `express`: A local package module in your Node.js app&#39;s `node_modules` folder—recommended for any project which needs to import `express` with `require()` or `import`.

## Express.js Generator Version

Before we proceed with installations, let&#39;s check the Express.js versions. We&#39;ll use an exact version 4.15.4 to avoid confusion resulting from potential future changes to the Express.js skeleton-generating mechanism and the module API.

For the Express.js Generator, which is a separate module, we&#39;ll use version 4.15.5, which is compatible with Express.js 4.15.5 and most likely with any other Express version which starts with number 4. Luckily, Express Generator will write the version of `express` it needs in `package.json` so we, developers, don't have to preoccupy ourselves too much with keeping versions compatible. 

If you already have Express Generator, then check the version with `$ express -V`. Yes, the actual command for Express Generator is confusingly enough is not `express-generator` like its npm name but just `express`. WHAT?! Go figure... Subsequently, any Express Generator commands are invoked with `express NAME`. 

You can uninstall generator using `$ sudo npm uninstall -g express-generator`. Or `$ sudo npm uninstall -g express` for Express.js 2.x and 3.x because before, version 4.x, Express.js Generator was a part of the Express.js module itself. After you&#39;ve uninstalled the older versions, install the proper version with the next section&#39;s commands.

Alternatively, you can just install a new version, and it should overwrite any prior installations. Here's the command to install the latest version:

```
npm i -g express-generator@latest
```

Let's see some other ways to install Express Generator.

## Express.js Generator Installation

To install the Express.js Generator as global package, run `$ npm install -g express-generator@4.15.5` from anywhere on your computer. This downloads and links the `$ express` terminal command to the proper path, so that later we can access its command-line interface (CLI) for the creation of new apps.

**Note**: For macOS and Linux users, if there is an error installing globally, most likely your system requires root/administrator rights to write to the folder. In this case, `$ sudo npm install -g express-generator@4.15.0` might be needed. Refer to Chapter 1 for more information on changing npm ownership.

Of course, we can be more vague and tell npm to install the latest version of `express-generator`: `$ npm i –g express-generator`. But in this case your results might be inconsistent with the book&#39;s examples.

Here are the results of running the aforementioned command:

```
/usr/local/bin/express -> /usr/local/lib/node_modules/express-generator/bin/express-cli.js
+ express-generator@4.15.5
updated 1 package in 1.793s
```

 Please notice the path: `/usr/local/lib/node_modules/express-generator`. This is where, on macOS/Linux systems, npm puts global modules by default. We verify the availability of Express.js CLI by running this: 
 
 ```
 $ express --version
 ```

Express is used with `require()`, and it's a local project dependency. Let's build a quick Hello World with Express.

## Local Express.js

For the local Express.js 4.15.5 module installation, let&#39;s create a new folder `hello-simple` somewhere on your computer: `$ mkdir hello-simple`. This will be our project folder for the chapter. Now we can open it with `$ cd hello-simple`. When we are inside the project folder, we can create `package.json` manually in a text editor or with the `$ npm init` terminal command.


The following is an example of the `package.json` file with vanilla `$ npm init` options (the license and author are configured by defaults in `npm config`):

```js
{
  "name": "hello-simple",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "Azat Mardan (http://azat.co/)",
  "license": "MIT"
}
```

Lastly, we install the module using npm (no need for `--save` in npm v5+):

```
$ npm install express@4.15.4 --save --exact
```

Or, if we want to be less specific, which is not recommended for this example, use:

```
$ npm i express -E
```

**Note**: Depending on your npm version, if you attempt to run the aforementioned `$ npm install express` command without the `package.json` file or the `node_modules` folder, the *smart* npm will traverse up the directory tree to the folder that has either of these two things. This behavior mimics Git&#39;s logic somewhat. For more information on the npm installation algorithm, please refer to [the official documentation](https://npmjs.org/doc/folders.html) (<https://npmjs.org/doc/folders.html>).

Alternatively, we can update the `package.json` file by specifying the dependency `("express": "4.15.4"` or `"express": "4.x")` and run `$ npm install`.

The following is the `package.json` file with an added Express.js v4.15.4 dependency:

```js
{
  "name": "hello-simple",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "Azat Mardan (http://azat.co/)",
  "license": "MIT",
  "dependencies": {
    "express": "4.15.4"
  }
}
```

Now when someone downloads this project, they can install all dependencies from `package.json` with either of the following two commands:

```   
$ npm install
$ npm i
```

Here are the result of installing Express.js v4.15.4 locally into the `node_modules` folder. Please notice the `package-lock.json` file created in the project root. It helps to lock versions to avoid breaking your code with new versions of dependencies.

```
$ npm i express -E
npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN hello-simple@1.0.0 No description
npm WARN hello-simple@1.0.0 No repository field.

+ express@4.15.4
added 43 packages in 4.686s
```

If you want to install Express.js to an existing project and save the dependency (a smart thing to do!) into the `package.json` file, which is already present in that project&#39;s folder, run `$ npm install express@4.15.5 --save`.

Create a `server.js` file in the  `hello-simple` folder:

```js
const express = require('express')
let app = express()

app.all('*', (req, res) => {
  res.send('Welcome to Practical Node.js!')
})

app.listen(3000, 
  () => {console.log('Open at localhost:3000')}
)
```

Then launch it with `node server.js` to see "Welcome to Practical Node.js!" in a browser at <http://localhost:3000>. You first Express app is working! 

Now let's actually see how to use the generator cause let's admit it because who doesn't like to have software to write our software?

# Express.js Scaffolding

So far, we&#39;ve covered Express.js installation and a simple Express server. When it comes to prototyping, it&#39;s vital to be able to get started quickly with the solid app skeleton, which is why many modern frameworks provide some type of scaffolding. Now is the time to explore its rapid app-creation mechanism, Express.js Generator! 🚀

Comparable with Ruby on Rails and many other web frameworks, Express.js comes with a CLI for jump-starting your development process. The CLI generates a basic foundation for the most common cases.

If you followed the global installation instructions in the installation section, you should be able to see the version number 4.15.0 if you run `$ express -V` from anywhere on your machine. If we type `$ express -h` or `$ express --help`, we should get a list of available options and their usage. The list of options is broken down below in this section to serve you, my dear readers, as a reference.

To generate a skeleton Express.js app, we need to run a terminal command—`express [options] [dir|appname]`—the options for which are the following:

- `-v`, `--view <engine>`:  Add view <engine> support (dust|ejs|hbs|hjs|jade|pug|twig|vash) (defaults to pug)
- `-c <engine>`, `--css <engine>`: Add stylesheet `<engine>` support, such as [LESS](http://lesscss.org) (<http://lesscss.org>), [Stylus](http://learnboost.github.io/stylus) (<http://learnboost.github.io/stylus>) or Compass(<http://compass-style.org>) (by default, plain CSS is used)
- `--git`: Add .gitignore
- `-f`, `--force`: Force app generation on a nonempty directory

If the dir/appname option is omitted, Express.js creates files using the current folder as the base for the project. Otherwise, the application is in the folder with the name provided.

Now that we&#39;re clear on the `express` Express Generator command and its options, let&#39;s go step by step to create an app with the scaffolding:

1. Check the Express.js version, because the app-generating code is prone to changes.
2. Execute the scaffolding command with options.
3. Run the application locally.
4. Understand the different sections, such as routes, middleware, and configuration.
5. Peek into the Pug template (more on this in Chapter 3).

## Express.js Command-Line Interface

Now we can use the CLI to spawn new Express.js apps. For example, to create an app with Stylus support, type the following:

```
$ express -c styl express-styl
```

Then, as the instructions in the terminal tell us (Figure 2-5), type:

```
$ cd express-styl && npm install
$ DEBUG=my-application ./bin/www
```

Open the browser of your choice at <http://localhost:3000> and you'll see "Express Welcome to Express" styled with a CSS which is coming from a Stylus file (`.styl`). If you go to <http://localhost:3000/users>, then you'll see "respond with a resource". If everything is working, then kudos, you've created an Express app with the Stylus support.

![alt](media/image5.png)

***Figure 2-5.** The result of using Express.js Generator*

If you don&#39;t have computer in front of you right now, here&#39;s the full code of `express-styl/app.js` using Express.js Generator v4.15.0. The server file has routes from the `routes` folder, Stylus, and a rudimentary error handler. You know I don't like semicolons. The `;` and `var` style are preserved from the code generated by the tool. 

```js
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const stylus = require('stylus');

const index = require('./routes/index');
const users = require('./routes/users');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
```

The Express app is exported with `module.exports` and is launched with `listen()` in the `bin/www` file. Let's see the main parts of the server file `app.js` that was created by the Express Generator.

## Routes in Express.js

When you open `express-styl/app.js`, you see two routes in the middle:

```js
const index = require('./routes/index');
const users = require('./routes/users');
...
app.use('/', routes);
app.use('/users', users);
```

The first one basically takes care of all the requests to the home page, such as `http://localhost:3000/`. The second takes care of requests to `/users`, such as `http://localhost:3000/users`. Both of the routes process URLs in a case-insensitive manner and in a same way as with trailing slashes.

By default, Express.js doesn&#39;t allow developers to route by query string arguments, such as the following:

```
GET: www.webapplog.com/?id=10233
GET: www.webapplog.com/about/?author=10239
GET: www.webapplog.com/books/?id=10&ref=201
```

However, it&#39;s trivial to write your own middleware. It might look like this:

```js
app.use((req, res, next) => {

})
```

That's right. The middleware is just a function with three argument. Two of which are good old friends: request and response. Then third argument is a callback that is invoked when all is done:


```js
app.use((req, res, next) => {
  next()
})
```

Developers can also finish the response with `send()`, `end() `, `render()` or any other Express method, or pass an error object to the `next()` callback:

```js
app.use((req, res, next) => {
  if (!req.session.loggedIn) // User didn't log in
    return next(new Error('Not enough permissions'))
  if (req.session.credits === 0) // User has not credit to play
    return res.render('not-enough-credits.pug')
  next()
})
```

Let's take a look at another example that has some logic to deal with a query string data using the `req.query` object:

```js
app.use((req, res, next) => {
  if (req.query.id) {
    // Process the id, then call next() when done
  else if (req.query.author) {
    // Same approach as with id
  else if (req.query.id && req.query.ref) {
    // Process when id and ref present
  } else {
    next();
  }
});

app.get('/about', (req, res, next) => {
    // This code is executed after the query string middleware
});
```

What's useful is that each `req` or `request` object in the *subsequent* middleware functions or request handler functions (i.e., routes) is the same object for the same request. This allows developers to decorate a reference or a value. For example, by having this middleware we can ensure that all subsequent middleware and routes *have access to `db`*:

```js
app.use((req, res, next) => {
  req.db = const db = mongoskin.db('mongodb://@localhost:27017/test')
})

app.use((req, res, next) => {
  req.articles =  req.db.collection('articles')
})

app.post('/users', (req, res, next) => { // use req.db or req.articles
  req.db.collection('users').insert({}, {}, (error, results)=>{
    req.articles.insert({}, {}, (error, results)=>{
      res.send()
    })
  })
})
```

Back to the `app.js` file. The request handler for the root route, that is `/`, is straightforward (`routes/index.js`, in this case). Everything from the HTTP request is in `req` and it writes results to the response in `res`. Here's `routes/index.js`:

```js
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
```

Here's `routes/users.js` in which we define and export a route:

```js
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
```

## Middleware as the Backbone of Express.js

Each line/statement above the routes in `express-styl/app.js` is middleware:

```js
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const stylus = require('stylus');
//...
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
```

The middleware includes pass-through functions that either do something useful or add something helpful to the request as it travels along each of them. For example, `bodyParser()` and `cookieParser()` add HTTP request payload (`req.body`) and parsed cookie data (`req.cookie`), respectively. And in our `app.js`, `app.use(logger('dev'));` is tirelessly printing in the terminal pretty logs for each request. In Express.js 3.x, many of these middleware modules were part of the Express.js module, but not in version 4.x. For this reason, Express Generator declared and included in `app.js` and `package.json`, and we installed with npm additional modules like `static-favicon`, `morgan`, `cookie-parser` and `body-parser`.

## Configuring an Express.js App

Here is how we define configuration statements in a typical Express.js app (the `app.js` file) with the use of `app.set()` methods, which take the name as a first argument and the value as the second:

```js
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
```

And then in the `bin/www` file, you will see the statement that saves the value of the port, which will be used later during the server bootup. The value is coming either from the environment variable or the hard-coded value of 3000 as a fallback when the environment variable `PORT` is undefined:

```js
app.set('port', process.env.PORT || 3000);
```

An ordinary setting involves a name, such as `views`, and a value, such as `path.join(__dirname, 'views')`, the path to the folder where templates/views live.

Sometimes there is more than one way to define a certain setting. For example, `app.enable('trust proxy')` for Boolean flags is identical (a.k.a., *sugar-coating*) to `app.set('trust proxy', true)`. Chapter 11 explains why we might need to trust proxy.

## Pug Is Haml for Express.js/Node.js

The Pug template engine is akin to the Ruby on Rails’ Haml in the way it uses whitespace and indentation, such as `layout.pug`: 

```pug
doctype html
html
  head
    title= title
    link(rel='stylesheet', href='/stylesheets/style.css')
  body
    block content
```

Yes, it might look weird, and yes, you might [hate it](https://webapplog.com/jade) (<https://webapplog.com/jade>) in the beginning because of a missing white space that breaks your app, but believe me: **Pug is awesome...** when you know it. Luckily, there's a whole chapter (Chapter 4) dedicated to templates, and you can learn Pug in there.

## Final Thoughts Scaffolding

As you&#39;ve seen, it&#39;s effortless to create web apps with Express.js. The framework is splendid for REST APIs as well. If you feel like the settings and other methods mentioned in this chapter just flew over your head, don&#39;t despair! *Pro Express.js: Master Express.js: The Node.js Framework For Your Web Development* (Apress, 2014) is dedicated solely to the Express.js, and its interface and can server as a good reference. This book published in 2014 is still relevant in 2018 and will be in 2019 because the book covers Express version 4 and its still the latest version because this version is very mature and "complete". Get the book on Amazon: <https://amzn.to/2tlSwNw>. For now, the next step is to create a foundation for our project: the Blog app.

# The Blog Project Overview

Our Blog app consists of five main parts from the user perspective:

- A home page with a list of articles (Figure 2-6)
- An individual article page with the full-text article
- An admin page for publishing and removing content
- A login page for accessing the aforementioned admin page
- A post article page for adding new content

![alt](media/image6.png)

***Figure 2-6.** The home page of the Blog app*

From a developer&#39;s point of view, the app has the following elements:

- *Main file* `app.js`: Settings, inclusions of routes, and other important logic. This is the file we typically run with `node` to start the server.
- *Routes*: All the logic related to pages and abstracted from `app.js` based on functional meaning, such as getting the data from the database and compiling the data into HTML
- *Node.js project file* `package.json`: Dependencies and other meta data
- *Dependencies in* `node_modules`: Third-party modules installed via `package.json`
- *Database*: An instance of MongoDB and some seed data
- *Templates*: The `*.pug` files
- *Static files*: Such as `*.css` or browser `*.js`
- *Configuration file* `config.json`: Security-insensitive application-wide settings, such as app title

Although somewhat primitive, this application contains all the CRUD (create, read, update, and delete) elements of modern web development. In addition, we use two approaches in Blog when sending the data to the server:

1. Submit data via traditional forms *with* full page refresh
2. Submit data via REST API (AJAX HTTP requests) *without* page refresh

The source code for this mini-project is under the `ch2/hello-world` folder of `practicalnode` GitHub repository: <https://github.com/azat-co/practicalnode>.

## Submitting the Data

The first approach, which is depicted in Figure 2-7, is called traditional or thick server, and is more SEO (search engine optimization) friendly. With this approach, all HTML is rendered on the server. Almost all of the logic is on the server as well. This is how web was designed to work. This is how all web apps worked in late 1990s.

![alt](media/image7.png)

***Figure 2-7.** Traditional server-side approach*

However, this traditional approach requires the reloading of the entire webpage. Thus it takes longer for users (especially on mobile) and is not as smooth and snappy as working with desktop apps. For this reason, developers started to move rendering and other logic to clients (browser). This is the second approach called thick client or client-side rendering and depicted in Figure 2-8.

![alt](media/image8.png)

***Figure 2-8.** REST API approach diagram*

Sending and receiving data via REST API/HTTP requests and rendering HTML on the client side is used with front-end frameworks such as React, Backbone.js, Angular, Ember, and [many others](http://todomvc.com) (<http://todomvc.com>) (Figure 2-8). The use of these frameworks is becoming more and more common nowadays because it allows for more efficiency (HTML is rendered on the client side, and only the data is transmitted) and better code organization.

Under the hood, virtually all front-end frameworks use jQuery&#39;s `ajax()` method. So, to give you a realistic example, the admin page uses REST API endpoints via jQuery `$.ajax()` calls to manipulate the articles, including publish, unpublish, and remove (Figure 2-9).

![alt](media/image9.png)

***Figure 2-9.** The admin page of Blog*

Unlike the previous sections of this chapter, which dealt with scaffolding with CLI, in this practical exercise I intentionally wanted to show how to create an Express.js app manually, because it will give you a better understanding of how things really work together in the framework.

Let&#39;s wait no more, and start by creating our project folders.

# Express.js Hello World Example

This is the second and the last Hello World example in this book! :-) The goal is to show readers how easy is it to create Express.js apps from scratch without generators, fancy modules, and middleware. We&#39;ll go through these sections:

- Setting up folders
- `npm init` and `package.json`
- Dependency declaration
- The `app.js` file
- Meet Pug
- Running the app

## Setting Up Folders

Express.js is very configurable, and almost all folders can be renamed. However, there are certain conventions that may help beginners to find their way through many files. Here are the two main folders that we use in this chapter, and their meaning:

- `node_modules`: Dependencies (third-party modules) live here as well as Express.js and Connect libraries
- `views`: Pug (or any other template engine) files

That&#39;s it for now, but if you want to create a few more folders for other examples for later chapters, then go ahead and create these:

- `routes`: Node.js modules that contain request handlers
- `db`: Seed data and scripts for MongoDB
- `public`: All the static (front-end) files, including HTML, CSS, JavaScript (browser), and Stylus (or any other CSS-language framework files)

Let&#39;s choose a project folder called `hello-world`, and create these directories with the Finder macOS app or with the following terminal command, which works on macOS and Linux (Figure 2-10):

```
mkdir {public,public/css,public/img,public/js,db,views,views/includes,routes}
```

![alt](media/image10.png)

***Figure 2-10.** Setting up folders*

Now we&#39;re all set to add project metadata with npm.

## npm init and package.json

For this example we will be creating the Express.js app from scratch, i.e., without Express.js Generator. We&#39;ll start with defining dependencies with `package.json` and npm.

npm is used not only as a registry, but also as a dependency management tool. Therefore, it&#39;s essential to set up the project file, `package.json`. Although it&#39;s possible to create the `package.json` file manually in a text editor, we can use the `$ npm init` command. Run this command in your project folder and answer all the questions (or leave them blank):

```
$ npm init
```

After the wizard has finished and the `package.json` file is there (don&#39;t worry if there&#39;s not much information there yet), we can install modules conveniently and add entries to `package.json` at the same time with `$ npm install <package-name> --save`. For example this is how you can install `express`:

```
$ npm install express --save
```

The previous command uses the latest stable version available on the npm registry at the moment. We recommend being more specific and ask for a specific version using `@`. Specific versions are better because new versions may have some breaking changes and simply will break your code. Specific versions are more robust in the land of the rapidly growing Node.js community.

```
$ npm install express@4.15.4 --save
```

For the Blog app, we need the following modules, which are the latest as of this writing:

- Express.js: 4.15.4
- Pug: 2.0.0-rc.4
- Stylus: 0.54.5

**Warning**: Feel free to update to newer versions. However, your results might vary, because it&#39;s very common in the Node.js ecosystem (“userland”) to see breaking changes introduced by new versions. This usually happens unintentionally by the dependency of a dependency. 

For example, even if we include a specific version of Express.js, such as 3.4.5, that module includes Pug with a wildcard `*`. This means after every `npm i` the latest version of Pug will be downloaded. One sunny wonderful day a new version of Pug will have some breaking update like a removal of a method which your app uses. Boom! Your app will suffer a great damage and will be broken. 

There are several strategies to mitigate such breaking behavior. Most of them involve locking the versions. And one cure is to just commit your `node_modules` folder along with the rest of the source code to a Git repository and use that instead of fetching modules according to `package.json` each time on deployment. That's what we did at DocuSign. We just committed entire `node_modules`. It worked well. Or use npm&#39;s shrinkwarp or package-lock features. Read more about this issue in Chapter 12.

## Dependency Declaration: npm install

Another way to create a `package.json` file (without using `$ npm init`) is to type or copy and paste `package.json` and run `$ npm install`:

```js
{{
  "name": "hello-advanced",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "4.15.4",
    "pug": "2.0.0-rc.4"
  }
}
```

In the end, the `node_modules` folder should be filled with the corresponding libraries.

If you noticed, one of the questions `npm init` asked was about the so-called entry point. In our case, it&#39;s the `app.js` file, and it&#39;s the home for most of the application&#39;s logic. To run it, simply use one of the following commands:

- `$ node app.js`
- `$ node app`
- `$ npm start`

Another approach is to name the entry point `index.js`. In this case, we get the benefit of running the script with the `$ node` . command.

Let&#39;s create the first iteration of `app.js`.

## The App.js File

The `app.js` file is the main file for this example. A typical structure of the main Express.js file `app.js` consists of the following areas (this may be a partial repeat from an earlier section, but this is important, so bear with me):

1. Require dependencies
2. Configure settings
3. Connect to database (*optional*)
4. Define middleware
5. Define routes
6. Start the server on a particular port
7. Start workers with clusters to scale (a term *spawn workers* is also used for this) (*optional*)

The order here is important, because requests travel from top to bottom in the chain of middleware.

Let&#39;s perform a quintessential programming exercise: writing the Hello World application. This app transitions smoothly into the Blog example project, so no effort is wasted!

Open `app.js` in a code editor of your choice and start writing (or just copy code from [GitHub](http://github.com/azat-co/blog-express) (<http://github.com/azat-co/blog-express>)).

First, all the dependencies need to be included with `require()`:

```js
const express = require('express');
const http = require('http');
const path = require('path');
```

Then, the Express.js object is instantiated (Express.js uses a functional pattern):

```js
let app = express();
```

One of the ways to configure Express.js settings is to use `app.set()`, with the name of the setting and the value. For example:

```js
app.set('appName', 'hello-advanced');
```

Let&#39;s define a few such configurations in `app.js`:

- `port`: A number on which our server should listen to requests
- `views`: Absolute path to the folder with template (`views` in our example)
- `view engine`: File extension for the template files (for example, `pug`, `html`)

If we want to use the port number provided in the environmental variables (*env vars* for short), this is how to access it: `process.env.PORT`.

So let&#39;s write the code for the settings we listed earlier:

```js
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
```

Next comes the middleware section of the application. Middleware is the backbone of the Express.js framework, and it comes in two flavors:

* Defined in external (third-party) modules, e.g., `app.use(bodyParser.json());` with `bodyParser.json` being imported from `body-parser`
* Defined in the app or its modules, e.g., `app.use(function(req, res, next){...});`

Middleware is a way to organize and reuse code and, essentially, **middleware is nothing more than a function with three parameters**: `request`, `response`, and `next`. We&#39;ll use more middleware (for example, for authorization and for persistence) in Chapter 6, but for now, its use will be minimal.

The next components in the `app.js` file are routes. Routes process requests. An illustration in Figure 2-11 shows how an HTTP request is processed. So the next section of `app.js` is where we define routes themselves (the order in `app.js` matters). The way routes are defined in Express.js is with helpers `app.VERB(url, fn1, fn2, ..., fn)`, where `fnNs` are request handlers, `url` is on a URL pattern in RegExp, and `VERB` values are as follows:

- `all`: Catch any requests, i.e., all HTTP methods
- `get`: Catch GET requests
- `post`: Catch POST requests
- `put`: Catch PUT requests
- `patch`: Catch PATCH requests
- `del`: Catch DELETE requests

**Note**: `del` and `delete` methods are aliases in older versions of Express. Just remember that `delete` is a valid operator in JavaScript/ECMAScript, and therefore in Node.js. The operator removes a property from an object, e.g., `delete books.nodeInAction`.

Routes are processed in the order in which they are defined. Usually, routes are put after middleware, but some middleware may be placed following the routes. A good example of such middleware, found after routes, is an error handler.

Figure 2-11 shows how a trivial request might travel across the web and the Express.js app, with the dotted lines being the connection inside it.

![alt](media/image11.png)

***Figure 2-11.** Following a simple request in an Express.js app*

In this Hello World example, a single route is used to catch requests of all methods on all URLs (`*` wildcard):

```js
app.all('*', (req, res) => {
  ...
})
```

Inside the request handler, a template is rendered with the `res.render()` function using name of the template `index` as the first argument and the data object as a second argument. The data has a message `msg` as the property of the second argument:

```js
app.all('*', function(req, res) {
  res.render('index', {msg: 'Welcome to Practical Node.js!'})
})
```

For reference, in `res.render(viewName, data, callback(error, html))` where parameters mean the following:

- `viewName`: A template name with filename extension or if `view engine` is set without the extension
- `data`: An optional object that is passed as `locals`; for example, to use `msg` in Pug, we need to have `{msg: "..."}`
- `callback`: An optional function that is called with an error and HTML when the compilation is complete

`res.render()` is not in the Node.js core and is purely an Express.js addition that, if invoked, calls core `res.end()`, which ends/completes the response. In other words, the middleware chain doesn&#39;t proceed after `res.render()`. `res.render` is highlighted in Chapter 4.

Last but not least are the instructions to start the server. In the previous Hello World app, you saw `app.listen()`, but `http.createServer(app).listen()` will work too. It consists of the core `http` module and its `createServer` method. In this method, the system passes the Express.js `app` object with all the settings and routes:

```js
http.createServer(app).listen(app.get('port'), () => {
  console.log(`Express server listening on port ${app.get('port')}`)
})
```

You can also use `https.createServer(app).listen()` for the HTTPS support when you are ready to deploy your server to production.

Here&#39;s the full source code of the `app.js` file for your reference:

```js
const express = require('express')
const http = require('http')
const path = require('path')

let app = express()

app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.all('*', (req, res) => {
  res.render(
    'index',
    {msg: 'Welcome to Practical Node.js!'}
  )
})

http
  .createServer(app)
  .listen(
    app.get('port'),
    () => {
      console.log(`Express.js server is listening on port ${app.get('port')}`)
    }
  )
```

Before we can run this server, we need to create the `index.pug` file in the `views` folder.

## Meet Pug: One Template to Rule Them All

Pug is an absolutely amazing template engine that allows developers to type less code and to execute powerfully almost all JavaScript functions. It also supports top-to-bottom and bottom-to-top inclusion and other useful things. Like its brother from the Ruby world, Haml, Pug uses whitespace/indentation as a part of its language. It&#39;s a convention to use two-space indentation.

The Pug syntax and its features are covered more extensively in Chapter 4. For now, just keep in mind that the way Pug works is that the first word is used as an HTML tag (HTML element), and the text that follows, which is inner text or inner content, is put inside this element. For example, here are two sibling elements `<h1>` and `<p>` with text inside of them. The space after the Pug elements `h1` and `p` is super important!

```pug
h1 hello
p Welcome to the Practical Node.js!
```

That produces the following HTML code:

```html
<h1>hello</h1>
<p>Welcome to the Practical Node.js!</p>
```

If we want to output a value of a variable (called `locals`), we use `=`. For example:

```pug
p= msg
```

For this example, create `index.pug` in the `views` folder that outputs a header and a paragraph with the value `msg` variable inside of that paragraph (i.e., inner text):

```pug
h1 hello
p= msg
```

I included more advanced examples of Pug later in this book. For now, everything is set for the first demo! 👀

## Running the Hello World App

Run the `$ node app` command from the project root. When your app is running you can open a browser at <http://localhost:3000>. Now you should see the Hello World text as it appears in Figure 2-12.

![alt](media/image12.png)

***Figure 2-12.** The Hello World app in action*

Nothing fancy so far, but it&#39;s worth pointing out that it took us just a few lines (the `app.js` file) to write a fully functional HTTP server! In the next chapter, we add more new and exciting pages using Pug instructions.

# Summary

In this chapter we learned what Express.js is and how it works. We also explored different ways to install it and use its scaffolding (command-line tool) to generate apps. We went through the Blog example with a high-level overview (traditional vs. REST API approaches), and proceeded with creating the project file, folders, and the simple Hello World example, which serves as a foundation for the book&#39;s main project: the Blog app. And then lastly, we touched on a few topics such as settings, a typical request process, routes, AJAX versus server side, Pug, templates, and middleware.

In the next chapter we'll examine an important aspect of modern web development and software engineering: test-driven development. We look at the Mocha module and write some tests for Blog in true TDD/BDD style. In addition, the next chapter deals with adding a database to Blog routes to populate these templates, and shows you how to turn them into working HTML pages!

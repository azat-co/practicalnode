<span id="publishing-a-node.js-module-and-contribu"
class="anchor"></span>

Chapter 12
----------
# Publishing Node.js Modules and Contributing to Open Source

One of the key factors that attributed to the rapid growth of the Node.js module ecosystem is its open-source nature and robust packaging systems (with registry). As of April 2013, JavaScript and Node.js had already surpassed any other language/platform in number of packages contributed per year ([source](http://caines.ca/blog/programming/the-node-js-community-is-quietly-changing-the-face-of-open-source/)):

-   Python: 1351 packages per year (29,720 packages in 22 years)
-   Ruby: 3022 packages per year (54,385 packages in 18 years)
-   Node.js: *6742 packages per year* (26,966 packages in 4 years)

This year’s (2014) numbers are even higher, and expectations are that, by mid 2014, Node.js will surpass other platforms, in absolute numbers, with Maven and Rubygems being the top dogs ([source](http://modulecounts.com/)).

Other factors that attribute to the Node.js popularity include:

-   Ability to share code between front-end/browser and server-side (with projects such as [browserify](http://browserify.org/) and [ender.js](https://github.com/ender-js/Ender))
-   Philosophy of small (in terms of lines of code and functionality) functional modules vs. large, standard/core packages (i.e., granularity)
-   Evolving ECMAScript standard and expressive nature, and ease of adoption of the JavaScript language

With this in mind, many Node.js enthusiasts find it rewarding to contribute to the ever-growing open-source community. When doing so, there are a few conventions to follow as well as concepts to understand<span id="in-this-chapter" class="anchor"></span>:

-   Recommended folder structure
-   Required patterns
-   `package.json`
-   Publishing to npm
-   Locking versions

Recommended Folder Structure
============================

Here is an example of a good, structured npm module:

```
webapp
    /lib
    webapp.js
    index.js
    package.json
    README.md
```

The `index.js` file does the initialization whereas `lib/webapp.js` has all the principal logic.

If you’re building a command-line tool, add the `bin` folder:

```
webapp
    /bin
    webapp-cli.js
    /lib
    webapp.js
    index.js
    package.json
    README.md
```

Also, for the CLI module, add the following to `package.json`:

```js
...
"bin": {
    "webapp": "./bin/webapp-cli.js"
},
...
```

The `webapp-cli.js` file starts with the line `#!/usr/bin/env node`, but then has normal Node.js code.

It’s a good idea to add unit tests to your external module, which increases confidence and the likelihood of other people using it. Some programmers go as far as not using a module that doesn’t have any tests! The added benefit is that tests serve as a poor man’s examples and
documentation.

TravisCI, which we covered in previous chapters, allows free testing for open-source projects. Its badges, which turn from red to green, depending on the status of tests (failing or passing, became the de facto standard of quality and are often seen on the README pages of the most popular Node.js projects.

Required Patterns
=================

There are a few common patterns for writing external (meant for use by other users, not just within your app) modules:

-   `module.exports` as a function pattern (recommended)
-   `module.exports` as a class pattern (not recommended)
-   `module.exports` as an object pattern
-   `exports.NAME` pattern; which could be an object or a function

Here is an example of the the `module.exports` as a function pattern:

```js
let _privateAttribute = 'A'
let _privateMethod = () => {...}
module.exports = function (options) { // Arrow function can also be used depending on what needs to be the value of "this"
    // Initialize module/object
    object.method = () => {...}
    return object
}
```

And here is an example of an equivalent with a function declaration:

```js
module.exports = webapp
function webapp (options) {
    // Initialize module/object
    object.method = () => {...}
    return object
}
```

**Tip** For info about named function expressions vs. function declarations, visit the comprehensive resource [Named function expressions demystified](http://kangax.github.io/nfe/#named-expr).

The file in which we include the module looks like this:

```js
const webapp = require('./lib/webapp.js')
const wa = webapp({...}) // Initialization parameters
```

More succinctly, it looks like this:

```js
const webapp = require('./lib/webapp.js')({...})
```

The real-life example of this pattern is the Express.js module ([source code](https://github.com/visionmedia/express/blob/master/lib/express.js#L26)).

The `module.exports` as a class pattern uses the so-called [*pseudoclassical instantiating/inheritance pattern*](http://javascript.info/tutorial/pseudo-classical-pattern), which can be recognized by the use of the `this` and `prototype` keywords:

```js
module.exports = function(options) {
    this._attribute = 'A'
    // ...
}
module.exports.prototype._method = function() {
    // ...
}
```

Notice the capitalized name and the `new` operator in the including file:

```js
const Webapp = require('./lib/webapp.js')
const wa = new Webapp()
// ...
```

The example of this `module.exports` as a class pattern is the OAuth module ([source code](https://github.com/ciaranj/node-oauth/blob/master/lib/oauth.js#L9)).

The `module.exports` as an object pattern similar to the first pattern (functional), only without the constructor. It may be useful for defining constants, locales, and other settings:

```js
module.exports = {
    sockets: 10,
    limit: 200,
    whitelist: [
    'azat.co',
    'webapplog.com',
    'apress.com'
    ]
}
```

The including file treats the object as a normal JavaScript object. For example, we can set `maxSockets` with these calls:

```js
const webapp = require('./lib/webapp.js')
const http = require('http')
http.globalAgent.maxSockets = webapp.sockets
```

**Note** The `require` method can read JSON files directly. The main difference is that JSON standard has mandatory double quotes (`"`) for wrapping property names.

The `exports.NAME` pattern is just a shortcut for `module.exports.NAME` when there’s no need for one constructor method. For example, we can have multiple routes defined this way:

```js
exports.home = function(req, res, next) {
    res.render('index')
}
exports.profile = function(req, res, next) {
    res.render('profile', req.userInfo)
}
// ...
```

And we can use it in the including file the following way:

```js
const routes = require('./lib/routes.js')
// ...
app.get('/', routes.home) 
app.get('/profile', routes.profile)
// ...
```

package.json
============

Another mandatory part of an npm module is its `package.json` file. The easiest way to create a new `package.json` file, if you don’t have one already (most likely you do), is to use `$ npm init`. The following is an example produced by this command:

```js
{
  "name": "webapp",
  "version": "0.0.1",
  "description": "An example Node.js app",
  "main": "index.js",
  "devDependencies": {},
  "scripts": {
    "test": "test"
  },
  "repository": "",
  "keywords": [
    "math",
    "mathematics",
    "simple"
  ],
  "author": "Azat <hi@azat.co>",
  "license": "BSD"
}
```

The most important fields are `name` and `version`. The others are optional and self-explanatory, by name. The full list of supported keys is located at [the npm web site](https://www.npmjs.org/doc/json.html).

**Warning** `package.json` must have double quotes around values and property names, unlike native JavaScript object literals.

It’s worth noting that `package.json` and npm do not limit their use. In other words, you are encouraged to add custom fields and devise new conventions for their cases.

Publishing to npm
=================

To publish to npm, we must have an account there. We do this by executing the following:

```
$ npm adduser
```

Then, simply execute from the project folder:

```
$ npm publish
```

Some useful npm commands are as follows:

-   `$ npm tag NAME@VERSION TAG`: tag a version
-   `$ npm version SEMVERSION`: increment a version to the value of `SEMVERSION` ([semver](http://semver.org/)) and update `package.json`
-   `$ npm version patch`: increment the last number in a version (e.g., 0.0.1 to 0.0.2) and update `package.json`
-   `$ npm version minor`: increment a middle version number (e.g., 0.0.1 to 0.1.0 or 0.0.1 to 1.0.0) and update `package.json`
-   `$ npm unpublish PACKAGE_NAME`: unpublish package from npm (take optional version with `@`)
-   `$ npm owner ls PACKAGE_NAME`: list owners of this package
-   `npm owner add USER PACKAGE_NAME`: add an owner
-   `$ npm owner rm USER PACKAGE_NAME`: remove an owner

Locking Versions
================

The rule of thumb is that when we publish external modules, we don’t lock dependencies’ versions. However, when we deploy apps, we lock versions in `package.json`. This is a common convention that many projects on npm follow (i.e., they don’t lock the versions). So, as you might guess, this may lead to trouble.

Consider this scenario: We use Express.js that depends on, say, Pug of the latest version (*). Everything works until, unknown to us, Pug is updated with breaking changes. Express.js now uses Pug that breaks our code. No bueno.

The solution: Commit `node_modules`! The following article describes nicely why committing your application’s `node_modules` folder (not the one for the external module!) to Git repo is a good idea: [node_modules in git](http://www.futurealoof.com/posts/nodemodules-in-git.html).

Why do this? Because, even if we lock dependency A in our `package.json`, most likely this module A has a wild card `*` or version range in its `package.json`. Therefore, our app might be exposed to unpleasant surprises when an update to the A module dependency breaks our system.

One significant drawback is that binaries often need to be rebuilt on different targets (e.g., macOS vs. Linux). So, by skipping `$ npm install` and not checking binaries, development operations engineers have to use `$ npm rebuild` on targets.

On the other hand, the same problem might be mitigated by using `$ npm shrinkwrap` ([official docs](https://www.npmjs.org/doc/cli/npm-shrinkwrap.html)). This command creates `npm-shrinkwrap.json`, which has *every* subdependency listed/locked at the current version. Now, magically, `$ npm install` skips `package.json` and uses `npm-shrinkwrap.json` instead!

When running Shrinkwrap, be careful to have all the project dependencies installed and to have only them installed (run `$ npm install` and `$ npm prune` to be sure). For more information about Shrinkwrap and locking versions with `node_modules`, see the article by core Node.js contributors: “[Managing Node.js Dependencies with Shrinkwrap](http://blog.nodejs.org/2012/02/27/managing-node-js-dependencies-with-shrinkwrap/).”

Summary
=======

Open-source factors have contributed to the success and widespread use of the Node.js platform. It’s relatively easy to publish a module and make a name for yourself (unlike other mature platforms with solid cores). We looked at the recommended patterns and structures, and explored a few commands to get started with publishing modules to npm.

*Practical Node.js* Conclusion
==============================

Lo and behold, this is the end of the book. There was a study that showed that the majority of programmers read zero books per year ([source](http://blog.codinghorror.com/programmers-dont-read-books-but-you-should/)). So, pat yourself on the back, because you’re on the road to awesomeness when it comes to building Node.js web apps. &#x263A;

Regarding the material covered in *Practical Node.js*, we explored real-world aspects of the Node.js stack. To do this, many things were essential, and by now you should have an awareness of how pieces fit together. For some technologies such as Pug and REST API, our coverage was quite extensive. However, most of the packages are very specific and tailored to our apps’ goals, so those topics were given a brief introduction, with references for further learning. Here’s a list of topics we covered:

-   Node.js and npm setup and development tools
-   Web apps with Express.js
-   TDD with Mocha
-   Pug and Handlebars
-   MongoDB and Mongoskin
-   Mongoose MongoDB ORM
-   Session, token authentication, and OAuth with Everyauth
-   REST APIs with Express and Hapi
-   WebSockets with ws, Socket.IO, and DerbyJS
-   Best practices for getting apps production ready
-   Deployment to Heroku and AWS
-   Structuring and publishing npm modules

Further Reading
===============

If you enjoyed this reading, you might like the programming blog about software engineering, startups, Agile development, and Node.js: [webapplog.com](http://webapplog.com). You can also follow the author of this book on Twitter at [@azat_co](http://twitter.com/azat_co) for tips and news about Node.js.

Here's the list of other books by the author Azat Mardan:

- [*React Quickly*](http://bit.ly/1RbD6l6) (Manning, 2017)
- [*Pro Express.js*](http://amzn.to/1D6qiqk) (Apress, 2014)
- [*Full Stack JavaScript*](https://github.com/azat-co/fullstack-javascript) (Apress, 2015)
-  [*Express.js Guide*](http://expressjsguide.com)*: The Comprehensive Book on Express.js*
-  [*JavaScript and Node.js FUNdamentails*](http://leanpub.com/jsfun)*: A Collection of Essential Basics*
-  [*ProgWriter*](http://progwriter.com/)*: Complete Guide to Publishing Programming Books*


Errata and Contacts
===================

If you spotted any mistakes (I'm sure you did), please open an issue or even better fix it and make a pull request to the GitHub repository of the book's examples: <https://github.com/azat-co/practicalnode>. For all other updates and contact information, the canonical home of the Practical Node.js book on the Internet is http://practicalnodebook.com.
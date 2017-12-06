Chapter 7
---------
# Boosting Your Node.js Data with the Mongoose ODM Library

Mongoose is a fully developed object document mapping (ODM) library for Node.js and MongoDB. The advantages of using ODM are many and go far beyond code organization or the ease of development. Typical ODM is a crucial piece of modern software engineering. 

Mongoose abstracts everything from the database, and the application code interacts only with objects and their methods. ODM also allows specifying relationships between different types of objects and putting business logic (related to those objects) in the classes. 

In addition, Mongoose has built-in validation and type casting that can be extended and customized according to needs. When used together with Express.js, Mongoose makes the stack truly adherent to the MVC concept.

Mongoose uses a similar interface to those of Mongo shell, native MongoDB driver, and Mongoskin. For this reason, main functions such as `find`, `update`, `insert`, `save`, `remove`, and so on, look and act the same, which helps us to get started with Mongoose faster. In this chapter we look at the following:

- Mongoose installation
- Connection establishment in a standalone Mongoose script
- Mongoose schemas
- Hooks for keeping code organized
- Custom static and instance methods
- Mongoose models 
- Relationships and joins with population
- Nested documents
- Virtual fields
- Schema type behavior amendment
- Express.js + Mongoose = true MVC

The source code for this chapter is in the `code/ch7/blog-express` directory of the practical node GitHub repository (https://github.com/azat-co/practicalnode).

# Mongoose Installation

First, we should install Mongoose with npm. Among many variations, this is one of the ways we can install Mongoose 4.13.0 into an empty folder:

```
$ npm init -y
$ npm i mongoose@4.13.0 -SE
```

# DB Connection in a Standalone Mongoose Script

Mongoose can be used as a standalone MongoDB library. To illustrate this, here’s a banal script that establishes a connection, creates a Mongoose model definition, instantiates the `practicalNodeBook` object, and then saves it to the database.

Let's create a rather simple `mongoose-example` (that the folder in `code/ch7`. To have access to the library, we need to include the mongoose module in our program:

```js
const mongoose = require('mongoose')
```

Unlike the Node.js native MongoDB driver, which requires us to write a few lines of code, Mongoose can connect to the database server in one line. Mongoose requests are buffered, so we don’t have to wait for the established connection like we do with the native driver which requires developers to put all the code in the callback of `open()`. 

To connect to DB, just call `mongoose.connect()` with at least the `uri` argument (first) or with optional `options` and `callback` (second and third). The uniform resource identifier (URI), a.k.a. a connection string, is the only required parameter. It follows a standard format of:

```
mongodb://username:password@host:port/database_name
```

In our example we use the default values. The host is `localhost`, and the port is 27017. The database name is `test` while there's no password or username.

```js
mongoose.connect('mongodb://localhost:27017/test', {useMongoClient: true})
mongoose.Promise = global.Promise
```

The line with `Promise` make Mongoose use native ES6 promise implementation. Developers can supply another promise implementation if they want (for example flow [bluebird](https://www.npmjs.com/package/bluebird)).

For situations that are more advanced, options and callbacks can be passed to `connect`. The `options` object supports [all properties of the native MongoDB driver](http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options) (<http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options>).

**Note** It’s a common practice in Node.js apps (and Mongoose) to open a database connection once, when the program starts, and then to keep it open until termination. This applies to web apps and servers as well. Ergo, there's no need to open and close connections.

This is easy so far, right? The next step is an important distinction that Mongoose introduces compared with Mongoskin and other lightweight MongoDB libraries. The step creates a model with the `model()` function by passing a string and a schema (more on schemas later). The model is usually stored in a capitalized literal:

```js
const Book = mongoose.model('Book', { name: String })
```

Now the configuration phase is over and we can create a document that represents a particular instance of the model `Book`:

```js
const practicalNodeBook = new Book({ name: 'Practical Node.js' })
```

Mongoose documents come with very convenient built-in methods (<http://mongoosejs.com/docs/api.html#document-js>) such as `validate`, `isNew`, `update`, and so on. Just keep in mind that these methods apply to this particular document, not the entire collection or model. 

The difference between documents and models is that a document is an instance of a model; a model is something abstract. It’s like your real MongoDB collection, but it is supported by a schema and is presented as a Node.js class with extra methods and attributes. Collections in Mongoose closely resemble collections in Mongoskin or native driver. Strictly speaking, models, collections, and documents are different Mongoose classes. 

Usually we don’t use Mongoose collections directly, and we manipulate data via models only. Some of the main model methods look strikingly familiar to the ones from Mongoskin or native MongoDB driver, such as `find`, `insert()`, `save()`, and so forth.

To finish our small script and make it write a document to the database, let’s use one of the document methods—`document.save()`. This methods is a documents methods which will save that document into the database. The method is asynchronous which by now you know will require a callback (or a promise or an async/await function). The callback has an error-first signature:

```js
practicalNodeBook.save((err, results) => {
  if (err) {
    console.error(err)
    process.exit(1)
  } else {
    console.log('Saved: ', results)
    process.exit(0)
  }
})
```

Here is the full source code for the `mongoose.js` file from the `code/ch7/mongoose-example` which create a new document with the property name:

```js
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
```

To run this snippet, execute the `$ node mongoose.js` command (MongoDB server must be running in parallel). The results of the script should output the newly created object with its Object ID, as seen in Figure 7-1.

![alt](media/image1.png)

***Figure 7-1.** Running a standalone Mongoose script that creates objects*

So far our schema was very basic. It had only one field `name` with the type String. Next we'll study what other type of fields are supported.

# Mongoose Schemas

Schema is a JSON-ish class that has information about properties/field types of a document. It also can store information about validation and default values, and whether a particular property is required. Schemas can contain business logic and other important information. 

In other words, schemas serve as blueprints for documents. They are needed for model creation (i.e., schemas are compiled into models). Schema benefits include validation and more robust adherence to the structure. For example, fields which are not in the schema will not be save to the database. Or as another example, fields which are required by are missing from a model will prevent the document to be saved. 

Mongoose and its models require schemas. Thus before we can use models properly, we need to define their schemas, e.g., the book schema with the name property of string type can be defined right in the model as you saw before or by itself with the `Schema` method from `mongoose`. Simply invoke `Schema` with an object and save it in a variable.

```js
const bookSchema = mongoose.Schema({
  name: String
})
```

**Warning** Mongoose ignores those properties that aren’t defined in the model's schema but allows the documents to be created, updated or saved. On the other hand, any violation of a type or omission of a required field will lead to an error and the document NOT being saved, updated or created.

Mongoose Schema supports various types of data. Some of these types are similar to JavaScript and thus Node types but some are new. These are the Mongoose data types:

- `String`: a standard JavaScript/Node.js string (a sequence of characters) type
- `Number`: a standard JavaScript/Node number type up to 253 (64-bit); larger numbers with [mongoose-long](https://www.npmjs.org/package/mongoose-long) (<https://www.npmjs.org/package/mongoose-long>) ([Git](https://github.com/aheckmann/mongoose-long)) (<https://github.com/aheckmann/mongoose-long>)
- `Boolean`: a standard JavaScript/Node Boolean type—true or false
- `Buffer`: a Node.js binary type (images, PDFs, archives, and so on)
- `Date`: an ISODate formatted date type, such as 2014-12-31T12:56:26.009Z
- `Array`: a standard JavaScript/Node array type
- `Schema.Types.ObjectId` a typical, MongoDB 24-character hex string of a 12-byte binary number (e.g., 52dafa354bd71b30fa12c441)
- `Schema.Types.Mixed`: any type of data (i.e., flexible free type)

**Warning** Mongoose does not listen to mixed-type object changes, so call `markModified()` before saving the object to make sure changes in the mixed-type field are persistent.

`ObjectId` is added automatically as a primary `_id` key if omitted in the `insert()` or `save()` methods; `_id` key can be used to [sort documents chronologically](http://docs.mongodb.org/manual/reference/object-id/) (<http://docs.mongodb.org/manual/reference/object-id>). They are available through `Schema.Types` or `mongoose.Schema.Types`, e.g., `Schema.Types.Mixed`.

We have a great deal of flexibility in defining our document schemas—for example, here's a schema with strings, dates, buffers, objects (mixed type) and object IDs. Moreover, you can set the default values right there in the schema. Default values greatly simplify the development because allow to omit values. That's default values will be use when no values are provided. 

But that's not all. We can define a function as a default value too. This is a dynamic way to set the value. Finally, using `[]` means the fields value will be an array with each individual item of that array having the type specified in the square braces `[]`. For example, contributors is an array of Object ID (probably referring to the collection of contributors).

```js
const ObjectId = mongoose.Schema.Types.ObjectId
const  Mixed = mongoose.Schema.Types.Mixed

const bookSchema = mongoose.Schema({
  name: String,
  created_at: Date,
  updated_at: {
    type: Date, 
    default: Date.now // Current timestamp
  },
  published: Boolean,
  authorId : { 
    type: ObjectId, 
    required: true // Require field
  },
  description: { 
    type: String, 
    default: null 
  },
  active: {
    type: Boolean, 
    default: false
  },
  keywords: { // Array of strings
    type: [String], 
    default: [] 
  },
  description: {
    body: String,
    image: Buffer // Binary or string data
  },
  version: {
    type: Number, 
    default: () => { // Dynamic value
      return 1
    }
  },
  notes: Mixed,
  contributors: [ObjectId]
})
```


It’s possible to create and use custom types that already have the rules for the ubiquitous e-mail and URL types, e.g., there’s a module [mongoose-types](https://github.com/bnoguchi/mongoose-types) (<https://github.com/bnoguchi/mongoose-types>). 

Mongoose schemas are pluggable, which means, by creating a plugin, certain functionality can be extended across all schemas of the application.

For better code organization and code re-use, in the schema, we can set up static and instance methods, apply plugins, and define hooks.

**Tip** For validation in Node.js in addition to Mongoose and before it, consider using the `validatior.js` and `express-validator` modules.

# Hooks for Keeping Code Organized

In a complex application with a lot of interrelated objects, we might want to execute certain logic before saving an object. Hooks are a good place to store such logic. For example, we might want to upload a PDF to the web site before saving a book document:

```js
bookSchema.pre('save', (next) => {
  // Prepare for saving
  // Upload PDF 
  return next()
})
```

On the other hand, before removing, we need to make sure there are no pending purchase orders for this book:

```js
bookSchema.pre('remove', (next) => {
  // Prepare for removing
  return next(e) // e is an instance of Error or null
})
```

Developers can set up pre and post hook on save, remove, and validate as well as on custom methods.

# Custom Static and Instance Methods

In addition to dozens of built-in Mongoose model methods, we can add custom ones. For example, to initiate a purchase, we can call the `buy` method on the document `practicalNodeBook` after we implement the custom instance method `buy()`:

```js
bookSchema.method({ // Instance methods
  buy: function (quantity, customer, callback) {
    const bookToPurchase = this // Exact book with id, title, etc.
    // Create a purchase order and invoice customer
    // Any document/instance method like save, valid, etc. will work on "this"
    return callback(results)
  },
  refund: function (customer, callback) {
    // Process the refund
    return callback(results)
  }
})
```

The custom instance methods are better to use instead of re-implementing the same logic over and over again. 

On the other hand, there are static methods. Static methods are useful when we either don’t have a particular document object or we don’t need it. For example, we don't need a particular book ID to run a report to get how much books have 0 inventory in the warehouse or to get how many books of a particular kind we have in store:

```js
bookSchema.static({ // Static methods for generic, not instance/document specific logic
  getZeroInventoryReport: function(callback) {
    // Run a query on all books and get the ones with zero inventory
    // Document/instance methods would not work on "this"
    return callback(books)
  },
  getCountOfBooksById: function(bookId, callback){
    // Run a query and get the number of books left for a given book
    // Document/instance methods would not work on "this"
    return callback(count)
  }
})
```

**Note** Hooks and methods must be added to the schemas before compiling them to models—in other words, before calling the `mongoose.model()` method.

# Mongoose Models

As in many other ORMs/ODMs, in Mongoose, the cornerstone object is a model. To compile a schema into a model, use `mongoose.model(name, schema)`—for example, to create a book model from `bookSchema` use `mongoose.model`:

```js
const Book = mongoose.model('Book', bookSchema)
```

The first parameter is just a string, which we can use later to pull an instance of this model. Usually, this string is the same as the object literal for the model. It's usually capitalized, e.g., `Book`. By default, Mongoose will use the model name to tie it to a collection name by pluralizing it. For example, `Book` model will use `books` collection.

Models are used to create documents (actual data). To do so, call `new ModelName(data)`—for example,this is how to create two documents for two different books using one `Book` model:

```js
const practicalNodeBook = new Book({ name: 'Practical Node.js' })
const javascriptTheGoodPartsBook = new Book({ name: "JavaScript The Good Parts"})
```

It’s better to assign the initial value through the constructor `new Book()` versus using the `document.set()` method later, because Mongoose has to process less function calls and our code remains more compact and better organized. Of course, this is possible only if we know the values when we create the instances. ;-)

**Don’t confuse static with instance model methods.** If we call a method on `practicalNodeBook`, it’s an instance method; if we call it on the `Book` object, it’s a static class method.

Models have static built-in methods that are very similar to Mongoskin and native MongoDB methods, such as `find()`, `create()`, and `update()`.

A list of the static Mongoose model methods (invoked on a capitalized object, e.g., `Book`) along with their meaning follows:

- `Model.create(data, [callback (error, doc)])`: creates a new Mongoose document and saves it to the database
- `Model.remove(query, [callback(error)])`: removes documents from the collection that match the query; when finished, calls `callback` with `error`
- `Model.find(query, [fields], [options], [callback(error, docs)])`: finds documents that match the query (as a JSON object); possible [to select fields](http://mongoosejs.com/docs/api.html#query_Query-select) (<http://mongoosejs.com/docs/api.html#query_Query-select>) and use [options](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#find) (<http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#find>)
- `Model.update(query, update, [options], [callback(error, affectedCount, raw)])`: updates documents, similar to native `update`
- `Model.populate(docs, options, [callback(error, doc)])`: populates documents using references to other collections; an alternative to another approach described in the next section
- `Model.findOne(query, [fields], [options], [callback(error, doc)])`: finds the first document that matches the query
- `Model.findById(id, [fields], [options], [callback(error, doc)])`: finds the first element for which `_id` equals the `id` argument (cast based on the schema)
- `Model.findOneAndUpdate([query], [update], [options], [callback(error, doc)])`: finds the first document that matches the query (if present) and updates it, returning the document; uses [`findAndModify`](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#findandmodify) (<http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#findandmodify>)
- `Model.findOneAndRemove(query, [options], [callback(error, doc)])`: finds the first document that matches the query and removes it when returning the document
- `Model.findByIdAndUpdate(id, [update], [options], [callback(error, doc)])`: similar to `findOneAndUpdate` using only the ID
- `Model.findByIdAndRemove(id, [options], [callback(error, doc)])`: similar to `findOneAndRemove` using only the ID

**Warning** Not all the Mongoose model methods trigger hooks. Some of them are executed directly. For example, calling `Model.remove()` does not trigger the `remove` hook, because no Mongoose documents are involved (instances of `Model` that use lowercase literals, e.g., `practicalNodeBook`).

The complete list of the methods is extensive; therefore, refer to [the official Mongoose API documentation](http://mongoosejs.com/docs/api.html#model-js) (<http://mongoosejs.com/docs/api.html#model-js>). The most used instance (document) methods are as follows:

- `doc.model(name)`: returns another Mongoose model
- `doc.remove([callback(error, doc)])`: removes this document
- `doc.save([callback(error, doc, affectedCount)])`: saves this document
- `doc.update(doc, [options], [callback(error, affectedCount, raw)])`: updates the document with `doc` properties, and `options` parameters, and then upon completion fires a callback with `error`, number of `affectedCount` and the database output
- `doc.toJSON([option])`: converts a Mongoose document to JSON (options are listed  later)
- `doc.toObject([option])`: converts a Mongoose document to a plain JavaScript object (options are listed later)
- `isModified([path])`: true/false, respectively, if some parts (or the specific path) of the document are or are not modified
- `markModified(path)`: marks a path manually as modified which is useful for mixed (`Schema.Types.Mixed`) data types because they don't trigger the modified flag automatically
- `doc.isNew`: true/false, respectively, whether the document is new or not new
- `doc.id`: returns the document ID
- `doc.set(path, value, [type], [options])`: sets `value` at a `path`
- `doc.validate(callback(error))`: checks validation manually (triggered automatically before `save()`)

Most often, you'll need to get data from your document, e.g., to send back to a client using `res.send()`. But the document object will have some additional Mongoose properties and methods. The two method listed above will help you to get just the data. They are `toObject()` and `toJSON()`. They take options. The options for `toObject()` and `toJSON()` are as follows:

- `getters`: true/false, calls all `getters` including path and virtual types
- `virtuals`: true/false, includes virtual `getters` and can override the `getters` option
- `minimize`: true/false, removes empty properties/objects (defaults to true)
- `transform`: transforms the function called right before returning the object

That's it for Mongoose methods for the most part. Of course, Mongoose has other methods for more edge case scenarios and advanced uses. You can learn about them by opening this link [the Mongoose document API](http://mongoosejs.com/docs/api.html#document-js) (<http://mongoosejs.com/docs/api.html#document-js>).

# Relationships and Joins with Population

Although, there are no relationships stored in a MongoDB database (as in most NoSQL DBs), we can do so in the application layer. We actually have to do so in a large application. 

And Mongoose makes connecting two entities by their relationship easier. It provides a feature called *population*. No. This population is not about people living in a certain area but it somehow related. Mongoose population is about adding more data to your query using relationships.

It allows us to fill certain parts of the document from a different collection. Let’s say we have `posts` and `users` collections. Users can write posts. Therefore, users collections "has" posts if we were to use one collections. 

Or we can use two collections (and models). In this case, we can reference posts in the user schema by using `ref` and the name of the model such as in the posts field of `userSchema`:

```js
const mongoose = require('mongoose')
const Schema = mongoose.Schema
  
const userSchema = Schema({
  _id: Number,
  name: String,
  posts: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Post' 
  }]
})
```

The actual `postSchema` does not have any mentions about the user model. It just has some string fields:

```js
const postSchema = Schema({
  _creator: { type: Number, ref: 'User' },
  title: String,
  text: String
})
```

The next few lines is where we create models and then bang! We can pull posts data with a single query, not two like we would have done without referencing and without `populate()`. Here's how to construct the query and then call `exec()` to run it:

```js
const Post  = mongoose.model('Post', postSchema)
const User = mongoose.model('User', userSchema)

User.findOne({ name: /azat/i })
  .populate('posts')
  .exec((err, user) => {
    if (err) return handleError(err) // Defined elsewhere
    console.log('The user has % post(s)', user.posts.length)
  })
```

**Note** `ObjectId`, `Number`, `String`, and `Buffer` are valid data types to use as references meaning they will work as foreign keys in the relational DB terminology.

In the previous query, we used a regular expression (RegExp) `/azat/i` which mean find me all name matching string azat case-insensitively. This feature is not exclusive to Mongoose. In fact, the native driver and its other wrappers, along with the `mongo` console all support RegExps. The syntax is the same as in normal JavaScript/Node.js RegExp patterns. Therefore, in a way, we perform a join query on our `Post` and `User` models.

Okay. It’s possible to return only a portion of populated results. For example, we can limit the number of posts to the first 10 only:

```js
  .populate({     
    path: 'posts',
    options: { limit: 10, sort: 'title' }
  })
```

Sometimes it’s more practical to return only certain fields instead of the full document. This can be done with `select`:

```js
  .populate({
      path: 'posts',
      select: 'title',
      options: { 
        limit: 10, 
        sort: 'title' 
      }
    })
```

In addition, Mongoose can filter the populated results by a query! For example, we can apply RegExp for “node.js” to the text (a `match` query property):

```js
  .populate({
    path: 'posts',
    select: '_id title text',
    match: {text: /node\.js/i},
    options: { 
      limit: 10, 
      sort: '_id' 
    }
  })
```

The query selects properties using `select` by the field names of `_id`, `title`, `text`. You see, queries can be as customized as you want them to be! The best practice is to query and populate only the required fields because this avoids potential leakage of sensitive information and reduces overhead on the system.

The `populate` method also works on multiple document queries. For example, we can use `find` instead of `findOne`:

```js
User.find({}, {
    limit: 10, 
    sort: { _id: -1}})
  .populate('posts')
  .exec((err, user) => {
    if (err) return handleError(err)
    console.log('The user has % post(s)', user.posts.length)
  })
```

**Tip** For custom sorting, we can add properties using `name: -1` or `name: 1` patterns and can pass the resulting object to the `sort` option. Again, this is a standard MongoDB interface and is not exclusive to Mongoose.

# Nested Documents

In the previous section, we saw how to populate query from one collection with the data form another collections. That's a more traditional approach to designing your database in a sense that it mimics relational database design with its normal forms and strics atomization of data. 

The document storage model in NoSQL databases is well-suited to use nested documents. This is better when you know what queries are the most frequently run. You can optimize your database to make it be biased of certain query. For example, if we know that the most typical use case is to read user profiles, then instead of having two collections—`posts` and `users`—we can have a single collection (`users`), with each item of that collection having `posts`.

The decision of whether to use separate collections or nested documents is more of an architectural question, and its answer depends on usage. For example, if posts are used only in the context of users (their authors)—say, on the users’ profile pages—then it’s best to use nested documents. However, if the blog features multiple users’ posts that need to be queried independently of their user context, then separate collections fit better.

To implement nested documents, we can use the type `Schema.Types.Mixed` in Mongoose schemas (`Schema`, e.g., `bookSchema` or `postSchema`) or we can create a new schema for the nested document. An example of the former approach is as follows:

```js
const userSchema = new mongoose.Schema({
  name: String,
  posts: [mongoose.Schema.Types.Mixed]
})
// Attach methods, hooks, etc.
const User = mongoose.model('User', userSchema)
```

However, the latter approach of using a distinct new subschema is more flexible and powerful. Take a look at this example in which we define two schemas and then one is used in an array field of another schema. This approach is better for code re-use because it'll allow you to use the nested schema else where, maybe in several more schemas. 

Here's `postSchema` is nested in an array field of `userSchema` because users can have posts and querying by users is the most typical use case for this app.

```js
const postSchema = new mongoose.Schema({
  title: String,
  text: String
})
// Attach methods, hooks, etc., to post schema
const userSchema = new mongoose.Schema({
  name: String,
  posts: [postSchema]
})
// Attach methods, hooks, etc., to user schema
const User = mongoose.model('User', userSchema)
```

To create a new user document or to save a post to an existing user when working with a nested posts document, treat the `posts` property as an array and just use the `push` method from the JavaScript/Node.js API, or use the MongoDB `$push` operand (http://docs.mongodb.org/manual/reference/operator/update/push/). 

For example, we can use MongoDB's `$push` in the `update()` query to add a post (`newPost`) to a user object, which is found by a matching ID (`_id` is `userId`):

```js
User.update(
  {_id: userId}, 
  {$push: {posts: newPost}}, 
  function (error, results) {
    // Handle error and check results
})
```

Sometime you see 'em other time you don't. Let's study a new Mongoose feature—virtual fields.

# Virtual Fields

Virtuals are fields that don’t exist in the database, but act just like regular fields in a Mongoose document when accessed in a document. To oversimplify, virtual fields are mock or fake fields that pretend to act and be normal ones. 

Virtual fields are awesome for dynamic data or creating aggregate fields. For example, if our system requires to have first name, last name and the full name (which is just a concatenation of the first two names)—there’s no need to store the full name values in addition to the first and last name values! All we need to do is concatenate the first and last name in a full name virtual. 

Another use case is to make the database backward compatible. That's how I avoided writing and running database migrations at Storify. Every there was a new DB schema, I just added a virtual to support old documents. 

For example, we might have thousands of user items in a MongoDB collection and we want to start collecting their locations. We have two options: run a migration script to add the default location (“none”) to the thousands of old user documents or use a virtual field and apply defaults at runtime!

To define a virtual we need to do two things:

1. Call the `virtual(name)` method to create a virtual type ([Mongoose API](http://mongoosejs.com/docs/api.html#document-js)) (<http://mongoosejs.com/docs/api.html#document-js>)
2. Apply a getter function with `get(fn)` ([Mongoose API](http://mongoosejs.com/docs/api.html#virtualtype_VirtualType-get)) (<http://mongoosejs.com/docs/api.html#virtualtype_VirtualType-get>)

As an example, let's build a gravatar link generator. [Gravatar](http://en.gravatar.com/), (<http://en.gravatar.com>) is a service that hosts profile images. The URL is always an [md5 hash](http://en.gravatar.com/site/implement/hash/) (<http://en.gravatar.com/site/implement/hash>) of the user’s e-mail. 

Therefore, we can get the virtual value (`gravatarUrl`) on the fly by hashing instead of storing the value (less overhead!). In this example, I intentionally made the input email mixed cased and with a trailing space, and then applied core Node module `crypto` for the md5 hashing:

```js
const crypto = require('crypto')

Identity.virtual('gravatarUrl')
  .get(function() { // Not fatty catty ()=>{}
    if (!this.email) return null // "this" is an instance/document
    let email = this.email // For example: email = "HI@azat.co "
    email = email.trim().toLowerCase()
    const hash = crypto
      .createHash('md5')
      .update(email)
      .digest('hex')
    const gravatarBaseUrl = 'https://secure.gravatar.com/avatar/'
    return gravatarBaseUrl + hash
  })
```

Or the case mentioned earlier, getting a full name out of first and last, is implemented by concatenating the names into one string as follows:

```js
userSchema.virtual('fullName')
  .get(function() {
    // "this" is an instance/document
    return `${this.firstName}  ${this.lastName}` 
  })
```

Another example is when only a subset of the full document *must* be exposed and not the full details as in the user model which has tokens and passwords. Thus we omit fields which we want to hide by whitelisting only the fields we want to expose such as username and avatar but not token, password or salt:

```js
userSchema.virtual('info')
  .get(function() {
    return {
      service: this.service,
      username: this.username,
      name: this.name,
      date: this.date,
      url: this.url,
      avatar: this.avatar
    }
  })
```

We used `get` for the virtual. Let's dig deeper into getters as well as it's close kin setter.

# Schema Type Behavior Amendment

Schemas are not just static boring type definitions. Developers can add function to bring the dynamism to the fields in the schema. Mongoose allows us to define/write getters (`get)`, setters (`set`), and defaults (`default`) right in the Schema! Same goes for validate and some other useful methods. 

`get` is invoked when a field is read while `set` when the field assigned a value. Developers can modify the actual value being read or assigned from/to the actual database document. For example, the URL field can have a `set()` method which enforces all strings into lowercase. Validate is triggered for the field validation and is typically used for some custom types such as emails.

Here's an examples of defining `set` (transfer to lower case when the value is assigned), `get` (when the number is extracted the "thousands" commas are added to it), `default` (brand new ObjectID is generated), and `validate` (checks for e-mail patterns and is triggered upon `save()`) all right in a JSON-like structure of the `Schema`:

```js
postSchema = new mongoose.Schema({
  slug: { 
    type: String, 
    set: function(slug) { 
      return slug.toLowerCase()
    }
  },
  numberOfLikes: {
    type: Number,
    get: function(value) {
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }
  },  
  posted_at: { 
    type: String, 
    get: function(value) { 
      if (!value) return null;
      return value.toUTCString()
    }
  },  
  authorId: { 
    type: ObjectId, 
    default: function() { 
      return new mongoose.Types.ObjectId() 
    } 
  },
  email: { 
    type: String, 
    unique: true, 
    validate: [ 
      function(email) {
        return (email.match(/[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i) != null)}, 
      'Invalid email'
    ] 
  }
})
```

If defining custom methods in the `Schema` definition is not an option for some reason (maybe our system requires us to do it dynamically), there's another approach to amending `Schema` behavior—to use chained methods:

1. Use `Schema.path(name)` to get `SchemaType` ([official docs](http://mongoosejs.com/docs/api.html#schema_Schema-path)) (<http://mongoosejs.com/docs/api.html#schema_Schema-path>).
2. Use `SchemaType.get(fn)` to set the getter method ([official docs](http://mongoosejs.com/docs/api.html#schematype_SchemaType-get)) (<http://mongoosejs.com/docs/api.html#schematype_SchemaType-get>).

For example, we can create a getter method for the `numberOfPosts` field:

```js
userSchema
  .path('numberOfPosts')
  .get(function() {
    return this.posts.length
  })
```

Path is just a fancy name for the nested field name and its parent objects, for example if we have ZIP code (`zip`) as a child of `contact.address` such as `user.contact.address.zip, the` the `contact.address.zip` is a path.

# Express.js + Mongoose = True MVC

To avoid rebuilding all other components unrelated to ODM, such as templates, routes, and so forth, we can factor the existing Blog from the previous chapter by making it use Mongoose instead of Mongoskin. This requires minimal effort but produces an abstraction layer between MongoDB and the request handlers. As  always, the fully functional code is available on GitHub, in the `ch7` folder. (<https://github.com/azat-co/practicalnode/tree/master/ch7>)

The process of refactoring starts with the creation of a new branch: `mongoose`. You can use the final solution in [the GitHub repository](https://github.com/azat-co/blog-express/tree/mongoose). (<https://github.com/azat-co/blog-express/tree/mongoose>). First, we need to remove Mongoskin and install Mongoose:

```
$ npm uninstall mongoskin –save
$ npm install mongoose@4.13.0 --save
```

`package.json` is amended to include `mongoose` and looks similar to this:

```js
{
  "name": "blog-mongoose",
  "version": "1.0.1",
  "private": true,
  "scripts": {
    "start": "make start",
    "seed": "sh ./seed.sh",
    "test": "make test",
    "st": "standard app.js && standard tests/index.js && standard routes/*"
  },
  "author": "Azat Mardan (http://azat.co/)",
  "license": "MIT",  
  "dependencies": {
    "body-parser": "1.18.2",
    "cookie-parser": "1.4.3",
    "errorhandler": "1.5.0",
    "everyauth": "0.4.9",
    "express": "4.16.2",
    "express-session": "1.15.6",
    "method-override": "2.3.10",
    "mongoose": "4.13.0",
    "morgan": "1.9.0",
    "pug": "2.0.0-rc.4",
    "serve-favicon": "2.4.5",
    "stylus": "0.54.5"
  },
  "devDependencies": {
    "expect.js": "0.3.1",
    "mocha": "4.0.1",
    "standard": "10.0.3",
    "superagent": "3.8.0"
  }
}
```

Now, in the `app.js` file, we can remove the Mongoskin inclusion (`mongoskin = require('mongoskin'),`) and add a new import statement for Mongoose:

```js
const mongoose = require('mongoose')
```

Mongoose uses models but Mongoskin does not. Thus, let’s create a folder `models` in our project folder (use bash: `$ mkdir models`) and include the folder with (it really includes `index.js` which we yet to create):

```js
const models = require('./models')
```

Substitute the Mongoskin connection, and `articles` and `users` collections statements shown below:

```js
const db = mongoskin.db(dbUrl, {safe: true})
const collections = {
  articles: db.collection('articles'),
  users: db.collection('users')
}
```

With just the Mongoose connection statement **leaving out** the `collections`:

```js
const db = mongoose.connect(dbUrl, {useMongoClient: true})
```

In the collection middleware, we remove if/else and `req.collections` lines inside the `app.use()`:

```js
app.use((req, res, next) => {
  if (!collections.articles || ! collections.users) // <--- REMOVE
    return next(new Error('No collections.')) 
  req.collections = collections // <--- REMOVE
})
```

Then, add the if/else validation for `Article` and `User` models (coming from `models/article.js` and `models/user.js`), and the models in the request with the `req.models = models` statement:

```js
app.use((req, res, next) => {
  if (!models.Article || !models.User) { // <--- ADD
    return next(new Error('No models.')) 
  }
  req.models = models // <--- ADD
  return next()
})
```

That’s it! The upgrade from Mongoskin to Mongoose is complete. ;-) For your reference, the full code of the resulting app.js is in the `code/ch7/blog-mongoose/app.js`.

Next, let's implement the schemas. In the `Article` schema, `title` is required and it's limited to 120 characters with `validate`. The `published` defaults to `false` if not specified upon object creation. The slug should never have spaces due to the `set` method.

To illustrate code reuse, we abstract the `find` method from the routes (`routes/article.js`) into the model (`models/article.js`). This can be done with all database methods:

```js
articleSchema.static({
  list: function (callback) {
    this.find({}, null, {sort: {_id: -1}}, callback)
  }
})
```

The, we compile the schema and methods into a model:

```js
module.exports = mongoose.model('Article', articleSchema)
```

The full source code of `article.js` with schema and a static method is as follows:

```js
const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    validate: [function (value) {
      return value.length <= 120
    }, 'Title is too long (120 max)'],
    default: 'New Post'
  },
  text: String,
  published: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    set: function (value) {
      return value.toLowerCase().replace(' ', '-')
    }
  }
})

articleSchema.static({
  list: function (callback) {
    this.find({}, null, {sort: {_id: -1}}, callback)
  }
})

module.exports = mongoose.model('Article', articleSchema)
```

The `models/user.js` file also begins with an inclusion and a schema:

```js
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    set: function (value) { 
      return value.trim().toLowerCase() 
    },
    validate: [
      function (email) {
        return (email.match(/[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i) != null)
      },
      'Invalid email'
    ]
  },
  password: String,
  admin: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model('User', userSchema)
```

The e-mail field is validated with RegExp, then is trimmed and forced to lowercase when it’s set.

To connect app.js and models, there must be `models/index.js` file which simply acts as a layer of abstraction by importing and exporting all the models:

```js
exports.Article = require('./article')
exports.User = require('./user')
```

We have `models/index.js` so that we don't need to import all schemas individually in our `app.js` and other files (potentially).

Now we modify the routes files. The `routes/article.js` file now needs to switch to Mongoose models instead of Mongoskin collections. So, in the `show` method, this Mongoskin line goes away:

```js
req.collections.articles.findOne({slug: req.params.slug}, 
  (error, article) => {
```

Then, this Mongoose line comes in to use the Article model from `req.models`:

```js
req.models.Article.findOne({slug: req.params.slug}, 
  (error, article) => {
```

The resulting `show` uses Mongoose method `findOne` from `Article` model and has slug presence validation before that:

```js
exports.show = (req, res, next) => {
  if (!req.params.slug) return next(new Error('No article slug.'))
  req.models.Article.findOne({slug: req.params.slug}, (error, article) => {
    if (error) return next(error)
    if (!article.published && !req.session.admin) return res.status(401).send()
    res.render('article', article)
  })
}
```

In the `list` method, remove Mongoskin code show below since we are not working with collections directly anymore:

```js
req.collections.articles.find({}).toArray((error, articles) => {
```

and replace it with Mongoose model code of `Article.list()`:

```js
req.models.Article.list((error, articles) => {
```

To get request handler which resembles this:

```js
exports.list = (req, res, next) => {
  req.models.Article.list((error, articles) => {
    if (error) return next(error)
    res.send({articles: articles})
  })
}
```

Next, in the `exports.add` method, find this line of Mongoskin code:

```js
req.collections.articles.insert(
  article, 
  (error, articleResponse) => {
```

is replaced with this Mongoose code which uses model:

```js
req.models.Article.create(article, (error, articleResponse) => {
```

The `exports.edit` method is trickier, and there are a few possible solutions:

1. Find a Mongoose document (e.g., `findById`) and use document methods (e.g., `update`)
2. Use the static model method `findByIdAndUpdate`

In both cases, this Mongoskin piece of code goes away:

```js
req.collections.articles.updateById(
  req.params.id, 
  {$set: req.body.article}, 
  (error, count) => {
```

We'll use the former two-step approach (i.e., find then update), because it's more versatile. So the above snippet is replaced by this code:

```js
req.models.Article.findById(
  req.params.id, 
  (error, article) => {
    if (error) return next(error)
    article.update({$set: req.body.article}, 
    (error, count, raw) => {
      if (error) return next(error)
      res.send({affectedCount: count})
  })
})
```

Just to show you a more elegant one-step approach which uses one method `findByIdAndUpdate()`(the latter from the new `exports.edit` implementation list above):

```js
req.models.Article.findByIdAndUpdate(
  req.params.id, 
  {$set: req.body.article}, 
  (error, doc) => {
    if (error) return next(error)
    res.send(doc)
  }
)
```

Similarly, with the `exports.del` request handler:

```js
exports.del = (req, res, next) => {
  if (!req.params.id) return next(new Error('No article ID.'))
  req.models.Article.findById(req.params.id, (error, article) => {
    if (error) return next(error)
    if (!article) return next(new Error('article not found'))
    article.remove((error, doc) => {
      if (error) return next(error)
      res.send(doc)
    })
  })
```

The `exports.postArticle` and `exports.admin` functions look like these (the functions' bodies are the same as when we used Mongoskin):

```js
req.models.Article.create(article, (error, articleResponse) => {
  // ...
})
req.models.Article.list((error, articles) => {
  // ...
})
```

Again, that’s all we have to do to switch to Mongoose for this route. However, to make sure there’s nothing missing, here’s the full code of the `routes/article.js` file:

```js
exports.show = (req, res, next) => {
  if (!req.params.slug) return next(new Error('No article slug.'))
  req.models.Article.findOne({slug: req.params.slug}, (error, article) => {
    if (error) return next(error)
    if (!article.published && !req.session.admin) return res.status(401).send()
    res.render('article', article)
  })
}

exports.list = (req, res, next) => {
  req.models.Article.list((error, articles) => {
    if (error) return next(error)
    res.send({articles: articles})
  })
}

exports.add = (req, res, next) => {
  if (!req.body.article) return next(new Error('No article payload.'))
  var article = req.body.article
  article.published = false
  req.models.Article.create(article, (error, articleResponse) => {
    if (error) return next(error)
    res.send(articleResponse)
  })
}

exports.edit = (req, res, next) => {
  if (!req.params.id) return next(new Error('No article ID.'))
  req.models.Article.findById(req.params.id, (error, article) => {
    if (error) return next(error)
    article.update({$set: req.body.article}, (error, count, raw) => {
      if (error) return next(error)
      res.send({affectedCount: count})
    })
  })
}

exports.del = (req, res, next) => {
  if (!req.params.id) return next(new Error('No article ID.'))
  req.models.Article.findById(req.params.id, (error, article) => {
    if (error) return next(error)
    if (!article) return next(new Error('article not found'))
    article.remove((error, doc) => {
      if (error) return next(error)
      res.send(doc)
    })
  })
}

exports.post = (req, res, next) => {
  if (!req.body.title) { res.render('post') }
}

exports.postArticle = (req, res, next) => {
  if (!req.body.title || !req.body.slug || !req.body.text) {
    return res.render('post', {error: 'Fill title, slug and text.'})
  }
  var article = {
    title: req.body.title,
    slug: req.body.slug,
    text: req.body.text,
    published: false
  }
  req.models.Article.create(article, (error, articleResponse) => {
    if (error) return next(error)
    res.render('post', {error: 'Article was added. Publish it on Admin page.'})
  })
}

exports.admin = (req, res, next) => {
  req.models.Article.list((error, articles) => {
    if (error) return next(error)
    res.render('admin', {articles: articles})
  })
}
```

The `routes/index.js` file, which serves the home page, is as follows:

```js
exports.article = require('./article')
exports.user = require('./user')

exports.index = (req, res, next) => {
  req.models.Article.find(
    {published: true},
    null,
    {sort: {_id: -1}},
    (error, articles) => {
      if (error) return next(error)
      res.render('index', {articles: articles})
    }
  )
}
```

Lastly, `routes/user.js` has a single line to change in `authenticate`

Now, we have `findOne()` from model `User`:

```js
exports.authenticate = function (req, res, next) {
  if (!req.body.email || !req.body.password) { return res.render('login', {error: 'Please enter your email and password.'}) }
  req.models.User.findOne({ // Change to model User
    email: req.body.email,
    password: req.body.password
  }, function (error, user) {
    if (error) return next(error)
    if (!user) return res.render('login', {error: 'Incorrect email&password combination.'})
    req.session.user = user
    req.session.admin = user.admin
    res.redirect('/admin')
  })
}
```

To check if everything went well, simply run Blog as usual with `$ node app` and navigate the pages on <http://localhost:3000/>. In addition, we can run Mocha tests with `$ mocha test`.

# Summary

In this chapter, we learned what Mongoose is, how to install it, how to establish a connection to the database, and how to create Mongoose schemas while keeping the code organized with hooks and methods. We also compiled schemas into models and populated references automatically, and used virtual fields and custom schema type properties. Last, we refactored Blog to use Mongoose and made our app gain a true MVC architecture.

Next, we'll cover how to build REST APIs with the two Node.js frameworks: Express.js and Hapi. This is an important topic, because more and more web developments shift towards heavy front-end logic and thin back-end. Some systems even go as far as building/using free-JSON APIs or back-as-a-service services. This tendency allows teams to focus on what is the most important for end-users: user interface, features, as well as what is vital for businesses: reduced iteration cycles, lower costs of maintenance and development. 

Another essential piece in this puzzle is test-driven practice. To explore it, we'll cover Mocha, which is a widely used Node.js testing framework. To REST APIs and TDD onward.

Chapter 5
---------
# Persistence with MongoDB and Mongoskin

NoSQL databases (DBs), also called _non-relational_ _databases_, are more horizontally scalable, and thus better suited for distributed systems. They are tailared to a specific queries. NoSQL databases deal routinely with larger data sizes than traditional ones. NoSQL databases are are usually open source.

The key distinction in implementation of apps with NoSQL DBs comes from the fact that NoSQL DBs are schema-less. They are simple stores. In other words, relationships between database entities are not stored in the database itself (no more join queries); they are moved to the application or object-relational mapping (ORM) levels—in our case, to Node.js code. Another good reason to use NoSQL databases is that, because they are schema-less, they are perfect for prototyping and Agile iterations (more pushes!).

MongoDB is a document store NoSQL database (as opposed to key value and wide-column store NoSQL databases, [http://nosql-database.org](http://nosql-database.org)). It&#39;s the most mature and dependable NoSQL database available thus far. In addition to efficiency, scalability, and lightning speed, MongoDB uses JavaScript–like language for its interface! This alone is magical, because now there&#39;s no need to switch context between the front end (browser JavaScript), back end (Node.js), and database (MongoDB).

The company behind MongoDB is an industry leader and provides education and certification through its online MongoDB University ([https://university.mongodb.com](https://university.mongodb.com)).

To get you started with MongoDB and Node.js, we examine the following in this chapter:

- Easy and proper installation of MongoDB
- How to run the Mongo server
- Data manipulation from the Mongo console
- MongoDB shell in detail
- Minimalistic native MongoDB driver for Node.js example
- Main Mongoskin methods
- Project: storing Blog data in MongoDB with Mongoskin

## Easy and Proper Installation of MongoDB

Next, we look at MongoDB installation from the official package, as well as using HomeBrew for macOS users (recommended).

The following steps are better suited for macOS/Linux–based systems, but with some modifications they can be used for Windows systems as well (i.e., `$PATH` variable, or the slashes). For non-macOS users, there are [many other ways to install](http://docs.mongodb.org/manual/installation) (<http://docs.mongodb.org/manual/installation>).

The HomeBrew installation is recommended and is the easiest path (assuming macOS users have `brew` installed already, which was covered in Chapter 1): 

```
$ brew install mongodb
```

If this doesn&#39;t work, try the manual path described later. One of them is to download an archive file for MongoDB at <http://www.mongodb.org/downloads>. For the latest Apple laptops, such as MacBook Air, select the OS X 64-bit version. The owners of older Macs should browse the link <http://dl.mongodb.org/dl/osx/i386>. The owners of other laptops and OSs, select the appropriate package for the download. 

**Tip**  If you don&#39;t know the architecture type of your processor when choosing a MongoDB package, type `$ uname -p` in the command line to find this information.

After the download, unpack the package into your web development folder or any other as long as you remember it. For example, my development folder is `~/Documents/Code` (`~` means home). If you want, you could install MongoDB into the `/usr/local/mongodb` folder.

_Optional:_ If you would like to access MongoDB commands from anywhere on your system, you need to add your `mongodb` path to the `$PATH` variable. For macOS, you need the open-system `paths` file which is located at `/etc/paths` with:

```
$ sudo vi /etc/paths
```

Or, if you prefer VS Code and have the `code` shell command installed:

```
$ code /etc/paths
```

Then, add the following line to the `/etc/paths` file:

```
/usr/local/mongodb/bin
```

Create a data folder; by default, MongoDB uses `/data/db`. Please note this might be different in newer versions of MongoDB. To create the data folder, type and execute the following commands:

```
$ sudo mkdir -p /data/db
$ sudo chown `id -u` /data/db
```

This data folder is where your local database instance will store all databases, documents, etc. - all data. The figure below shows how I create my data folder in `/data/db` (root, then data then db), and changed ownership of the folder to my user instead of it being a root or whatever it was before. (Science proved that not having folders owned by root, reduces the number of permission denied errors by 100%.)

Figure 5-1 shows how this looks onscreen.

![alt](media/image1.png)

***Figure 5-1.** Initial setup for MongoDB: create the data directory*

If you prefer to store data somewhere else rather than `/data/db`, then you can do it. Just specify your custom path using the `--dbpath` option to `mongod` (main MongoDB service) when you launch your database instance (server).

If some of the steps weren't enough, then here's the another interpretation of the installation instructions for MongoDB on various OSs are available at MongoDB.org, &quot;[Install MongoDB on OS X](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/)&quot;(http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/). For Windows users, there is a good walk-through article titled &quot;[Installing MongoDB](http://www.tuanleaded.com/blog/2011/10/installing-mongodb)&quot;(http://www.tuanleaded.com/blog/2011/10/installing-mongodb).

# How to Run the Mongo Server

To run the Mongo server (a.k.a. DB instance, service or daemon), there's `mongod` command. If you installed in manually and didn't link the location to PATH, then go to the folder where you unpacked MongoDB. That location should have a `bin` folder in it. From that folder, type the following command:

```
$ ./bin/mongod
```

If you like most normal developers, pefer to always navigate to a DB folder and just type `mongod` anywhere on your computer, I assume you exposed that DB folder in your PATH variable. So if you added `$PATH` for the MongoDB location, type the following *anywhere you like*:

```
$ mongod
```

**Note**:        Oh, yeah. Don&#39;t forget to restart the terminal window after adding a new path to the `$PATH` variable (Figure 5-2). That's just how terminal apps work. They might not pick up your newest PATH value until you restart them.

![alt](media/image2.png)

***Figure 5-2.** Starting up the MongoDB server*

There are tons of info on the screen. If you can find and see something saying about 'waiting' then you are all set, a message like this:

```
MongoDB starting: pid =7218 port=27017...
...
waiting for connections on port 27017
```

That text means the MongoDB database server is running. Congrats! By default, it&#39;s listening at <http://localhost:27017>. This is the host and port for the scripts and applications to access MongoDB. In our Node.js code, we use 27017 for for the database and port 3000 for the server.

If you see anything else, then you probably have one of the two:

* The data or db folders are not create or create with root permissions. Solution is to create it with non-root.
* The MongoDB folder is not exposed and `mongod` cannot be found. Solution is to use the correct location or expose the location in PATH.

Please fix the issue or if you are all set with the 'waiting' notice, the let's go and play with the database using Mongo Console.

# Data Manipulation from the Mongo Console

Akin to the Node.js REPL, MongoDB has a console/shell that acts as a client to the database server instance. This means that we have to keep the terminal window with the server open and running while using the console in a different window/tab.

From the folder where you unpacked the archive, launch the `mongod` service with the command pointing to the bin folder:

```
$ ./bin/mongod
```

Or, if you installed MongoDB globally (recommended), launch the `mongod` service with just the command without path:

```
$ mongod
```

You should be able to see information in your terminal saying 'waiting for connections on 27-17'.

Now, we will launch a separate process or an application if you will. It's called the MongoDB console or shell and it allows developers to connect to the database instance and perform pretty much anything they want: create new documents, update them and delete. In other words, Mongo console is a client. Its benefit is that it comes with MongoDB and does NOT require anything fancy or complex. It work in the terminal which mean you can use it on almost any OS (yes, even on Windows). 

The name of the command is `mongo`. Execute this command in a *new* terminal window (_important!_). Again, if you didn't expose your MongoDB to PATH, then, in the same folder in which you have MongoDB, type the `mongo` command with path to this `mongo` file which is in the `bin` of the MongoDB installation. Open another terminal window in the same folder and execute:

```
$ ./bin/mongo
```



Or, if you have `mongo` "globally" by exposing the MongoDB's bin into PATH, simply type from any folder (you don't have to be in the MongoDB folder or specify bin since you already have that path in your PATH environment variable):

```
$ mongo
```

When you successfully connect to the database instance, then you should see something like this. Of course the exact version will be depending on your version of the MongoDB shell.

```
MongoDB shell version: 2.0.6
connecting to: test
```

Did you notice the cursor change? It's now `>` as shown in Figure 5-3. It mean you are in a different environment than bash or zsh (which I use). You cannot execute shell command anymore so don't try to use `node server.js`, or `mkdir my-awesome-pony-project`. It won't work. But what will work is JavaScript, Node.js and some special MongoDB code. For example, type and execute the following two commands to save a document `{a: 1}` (super creative, I know, thanks) and then query the collection to see the newly created document there. 

```
> db.test.save( { a: 1 } )
> db.test.find()
```

Figure 5-3 shows this. If you see that your record is being saved, then everything went well. Commands `find` and `save` do exactly what you might think they do. ;-) 

![alt](media/image3.png)

***Figure 5-3.** Running MongoDB client and storing sample data*


**Note**  On macOS (and most Unix systems), to close the process, use `control + c`. If you use `control + z`, it puts the process to sleep (or detaches the terminal window). In this case, you might end up with a lock on data files and then have to use the &quot;kill&quot; command (e.g., `$ killall node`) or Activity Monitor and delete the locked files in the data folder manually. For a vanilla macOS terminal, `command +` . is an alternative to `control + c`.

What are some other MongoDB console command which developers like you and me can use? We will study the most important of them next.

# MongoDB Console in Detail

MongoDB console syntax is JavaScript. That's wonderful. The last thing we want is to learn a new complex language like SQL. However, MongoDB console methods are not without their quirks. For example, `db.test.find()` has a class name db, then my collection name test and then a method name find. In other words, it's a mix of arbitrary (custom) and mandatory (fixed) names. That's unusual. 

Let's take a look at the list of the most useful MongoDB console (shell) commands are listed here:

- `> help`: prints a list of available commands
- `> show dbs`: prints the names of the databases on the database server to which the console is connected (by default, localhost:27017; but, if we pass params to `mongo`, we can connect to any remote instance)
- `> use db_name`: switches to `db_name`
- `> show collections`: prints a list of collections in the selected database 
- `> db.collection_name.find(query);`: finds all items matching `query`
- `> db.collection_name.findOne(query);`: finds one item that matches `query`
- `> db.collection_name.insert(document)`: adds a document to the `collection_name` collection
- `> db.collection_name.save(document);`: saves a document in the `collection_name` collection—a shorthand of upsert (no `_id`) or insert (with `_id`)
- `> db.collection_name.update(query,{$set: data});`: updates items that match `query` in the `collection_name` collection with `data` object values
- `> db.collection_name.remove(query)`; removes all items from `collection_name` that match `query` criteria
- `> printjson(document);`: prints the variable `document`

It&#39;s possible to use good old JavaScript, for example, storing document in variable is as easy as using an equal sign. `printjson()` is a utility method which outputs the value of a variable.

```
> var a = db.messages.findOne()
> printjson(a)
> a.text = "hi"
> printjson(a)
> db.messages.save(a)
```

`save()` works two ways. If you have `_id` which is a unique MongoDB ID, then the document will be updated with whatever new properties where passed to the `save()` method. That's the example above in which we create a new property `text` and assigned a value of `hi` to it. 

When there's not `_id`, then MongoDB console will insert a new document and create a new Object ID in `_id`. That's the very first example where we used `db.test.save({a:1})`. To sum up, `save()` work like an upsert (update or insert).

For the purpose of saving time, the API listed here is the bare minimum to get by with MongoDB in this book and its projects. The real interface is richer and has more features. For example, `update` accepts options such as `multi: true`, and it&#39;s not mentioned here. A full overview of the MongoDB interactive shell is available at mongodb.org, &quot;[Overview—The MongoDB Interactive Shell](http://www.mongodb.org/display/DOCS/Overview+-+The+MongoDB+Interactive+Shell)&quot;(http://www.mongodb.org/display/DOCS/Overview+-+The+MongoDB+Interactive+Shell).

I'm sure you all enjoyed typing those bracets and parenthesis in the terminal just to get a typo somewhere. That's why I create MongoUI which is a web-based database admin interface. It allows you to view, edit, search, remove MongoDB documents without typing commands. Check out MongoUI at <https://github.com/azat-co/mongoui>. You can install MongoUI with npm by executing `nmp i -g mongoui` and then start it with `mongoui`. It'll open the app in your default browser and connect to your local db instance (if there's one).

One more useful MongoDB command (script) is `mongoimport`. It allows developers to supply a JSON file which will be imported to a database. Let's say you are migrating a database or have some initial data which you want to use but the database is empty right now. How do you create multiple records? You can copypasta to MongoDB console but that's not fun. Use `mongoimport`. Here's an example how to inject a data from a JSON file with an array of object:

```

mongoimport --db dbName --collection collectionName --file fileName.json --jsonArray
```

You don't need to do anything extra to install mongoimport. It's already part of the MongoDB installation and lives in the same folder as `mongod` or `mongo`, i.e., `bin`. And JSON is not the only format which mongoimport takes. It can be CSV, or TSV as well. Isn't it neat? 

Connecting and working with a database directly is a super power. You can debug or seed the data without the need of writing any Node code. But sooner or later, you'll want to automate the work with the database. Node is great for that. To be able to work with MongoDB from Node, we need a driver.


# Minimalistic Native MongoDB Driver for Node.js Example

To illustrate the advantages of Mongoskin, let&#39;s use [Node.js native driver for MongoDB](https://github.com/christkv/node-mongodb-native) (<https://github.com/christkv/node-mongodb-native>) first. We need to write a basic script that accesses the database.

First, however, let&#39;s install the MongoDB native driver for Node.js with SE to save the exact version in a dependency (must create `package.json` first):

```
$ npm install mongodb@2.2.33 -SE
```

This is an example of a good `package.json` file with the driver dependency listed in there. It's from `code/ch5/mongodb-examples`. There are two more packages which you can ignore for now. One of them is validating code formatting (`standar`) and another is an advanced MongoDB library (`mongoskin`):

```js
{
  "name": "mongodb-examples",
  "version": "1.0.1",
  "description": "",
  "main": "mongo-native-insert.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "Azat Mardan (http://azat.co/)",
  "license": "MIT",
  "dependencies": {
    "mongodb": "2.2.33",
    "mongoskin": "2.1.0"
  },
  "devDependencies": {
    "standard": "10.0.3"
  }
}
```

It's always a good learning to start from something small and then build the skills gradually. Thus, let's study a small example which tests whether we can connect to a local MongoDB instance from a Node.js script and run a sequence of statements analogous to the previous section:

1. Declare dependencies
2. Define the database host and port
3. Establish a database connection
4. Create a database document
5. Output a newly created document/object

The file name for this short script is `code/ch5/mongo-native-insert.js`. We start this file with some imports. Then we will connect to the database using host and port
This is one of the ways to establish a connection to the MongoDB server, in which the `db` variable holds a reference to the database at a specified host and port:

```js
const mongo = require('mongodb')
const dbHost = '127.0.0.1'
const dbPort = 27017
const {Db, Server} = mongo
const db = new Db('local', new Server(dbHost, dbPort), {safe: true})
```

Once the connection is established with `db.open`, we can work with the database. So to open a connection, type the following:

```javascript
db.open((error, dbConnection) => {
	// Do something with the database here
	// console.log(util.inspect(db))
	console.log(db._state)
	db.close()
})
```

For example, to create a document in MongoDB, we can use the `insert()` method. Unlike Mongo console, this `insert()` is asynchronous which means it won't execute immediately. The results will be coming later. That's why there's a callback. The callback has error as its first argument. It's called error-first pattern. The result which is the newly created document is the second argument of the callback. In the console, we don't really have multiple clients executing queries so in the console methods are synchronous. Situation is different in Node because we want to process multiple clients while we wait for the database to respond.

It's important to handle the error by checking for it and then exiting with an error code of 1: 

```js	   
dbConnection
  .collection('messages')
  .insert(item, (error, document) => {
    if (error) {
      console.error(error)
      return process.exit(1)
    }
    console.info('created/inserted: ', document)
    db.close()
    process.exit(0)
  })
```

Here is the  entire code to accomplish these five steps. The most important thing to observe and remember is that ENTIRE working code of `insert()` is **inside** of the `open()` callback. This is because `open()` is asynchronous which in turn is because `dbConnection` becomes available with a delay and we don't want to block the Node's event loop waiting for the `dbConnection`. The full source code of this script is in the `mongo-native-insert.js` file and below for convenience in case you don't have the GitHub open right now:

```javascript
const mongo = require('mongodb')
const dbHost = '127.0.0.1'
const dbPort = 27017

const {Db, Server} = mongo
const db = new Db('local',
  new Server(dbHost, dbPort),
  {safe: true}
)

db.open((error, dbConnection) => {
  if (error) {
    console.error(error)
    return process.exit(1)
  }
  console.log('db state: ', db._state)
  const item = {
    name: 'Azat'
  }
	dbConnection
	  .collection('messages')
	  .insert(item, (error, document) => {
      if (error) {
        console.error(error)
        return process.exit(1)
      }
      console.info('created/inserted: ', document)
      db.close()
      process.exit(0)
	  }
	)
})
```


Now we can build a few more methds. For example, another `mongo-native.js` script looks up any object and modifies it:

1. Get one item from the `message` collection.
2. Print it.
3. Add a property text with the value `hi`.
4. Save the item back to the `message` collection.


After we install the library, we can include the MongoDB library in our `mongo-native.js` file as well as create host and port values.

```js
const mongo = require('mongodb')
const dbHost = '127.0.0.1'
const dbPort = 27017
const {Db, Server} = mongo
const db = new Db('local', new Server(dbHost, dbPort), {safe: true})
```

Next open a connection. It&#39;s always a good practice to check for any errors and exit gracefully.

```javascript
db.open((error, dbConnection) => {
  if (error) {
    console.error(error)
    process.exit(1)
  }
  console.log('db state: ', db._state)
```

Now, we can proceed to the first step mentioned earlier—getting one item from the `message` collection. The first argument to `findOne()` is a search or query criteria. It works as a logical AND meaning the properties passed to `findOne()` will be matched against the documents in the database. The returned document will be in the callback's argument. This document is in the `item` variable. 

The variable name doesn't matter that much. What matters is the order of an argument in the callback function. Ergo, **first argument is always an error object even when it's null. The second is the result of a method.** This is true for almost all MongoDB native driver methods but not for every Node library. Node developers need to read the documentation for a particular library to see what arguments are provided to a callback. But in the case of MongoDB native drive, error and result is the convention to remember and use.

```javascript
  dbConnection.collection('messages').findOne({}, (error, item) => {
    if (error) {
      console.error(error)
      process.exit(1)
    }
```

The second step, print the value, is as follows:

```javascript
    console.info('findOne: ', item)
```
As you can see, methods in the console and Node.js are not much different except that in Node developers *must use callbacks*.

So let&#39;s proceed to the remaining two steps: adding a new property and saving the document. `save()` works like an upsert: if a valid `_id` is provided, then the documents will be updated, if not then the new documents will be created.

```javascript
    item.text = 'hi'
    var id = item._id.toString() // we can store ID in a string
    console.info('before saving: ', item)
    dbConnection
      .collection('messages')
      .save(item, (error, document) => {
        if (error) {
          console.error(error)
          return process.exit(1)
        }
        console.info('save: ', document)
```

To double-check the saved object, we use the ObjectID that we saved before in a string format (in a variable `id`) with the `find` method. This method returns a cursor, so we apply `toArray()` to extract the standard JavaScript array:

```javascript
        dbConnection.collection('messages')
          .find({_id: new mongo.ObjectID(id)})
          .toArray((error, documents) => {
            if (error) {
              console.error(error)
              return process.exit(1)
            }
            console.info('find: ', documents)
            db.close()
            process.exit(0)
          }
        )
    })
  })
})
```

The full source code of this script is available in the `mongo-native-insert.js` and `mongo-native.js` files. If we run them with `$ node mongo-native-insert` and, respectively, `$ node mongo-native`, while running the `mongod` service the scripts should output something similar to the results in Figure 5-4. There are three documents. The first is without the property text; the second and third documents include it.


![alt](media/image4.png)

***Figure 5-4.** Running a simple MongoDB script with a native driver*

Majority of readers will be good with the methods studied here since these methods provide all the CRUD functionality (create, read, update and delete). But for more advanced developers, the full documentation of this library is available at <http://mongodb.github.com/node-mongodb-native/api-generated/db.html> and on the MongoDB web site.

# Main Mongoskin Methods

Meet Mongoskin (don't confuse with Redskin). Mongoskin provides a better API than the native MongoDB driver. To illustrate this, compare this code with the example written using native MongoDB driver for Node.js. As always, to install a module, run npm with install—for example,

```
$ npm i mongoskin@2.1.0 -SE
```

The connection to the database is a bit easier with Mongoskin. We don't have to put all of our code into the `open()` callback. Yay! All we need is to invoke `db()`:

```javascript
const mongoskin = require('mongoskin')
const { toObjectID } = mongoskin.helper
const dbHost = '127.0.0.1'
const dbPort = 27017
const db = mongoskin.db(`mongodb://${dbHost}:${dbPort}/local`)
```

As you can see the Mongoskin method to connect to the database does not require you to put all the rest of the code in the callback. That is because there's library which will buffer up the upcoming queries and execute that when the connection is ready.

We can also create our own methods on collections. This might be useful when implementing an model-view-controller-like (MVC-like) architecture by incorporating app-specific logic into these custom methods. See how we can create a custom method `findOneAndAddText()` which take some text (duh) and executes two MongoDB methods to first find that document and then update it in the database with the passed text. Custom methods are your own project-specific methods and they are great at re-using code.

Did you notice that there's no fat arrow function for the custom method `findOneAndAddText()`? That's because we need to let Mongoskin to pass the collection to use `this`  inside of this method. If we use the fat arrow `()=>{}`, then we can's use `this.findOne` inside of the custom method.

```javascript
db.bind('messages').bind({
  findOneAndAddText: function (text, fn) { // no fat arrow fn because we need to let bind pass the collection to use this on the next line... this can be replaced with db.messages too
    this.findOne({}, (error, document) => {
      if (error) {
        console.error(error)
        return process.exit(1)
      }
      console.info('findOne: ', document)
      document.text = text
      var id = document._id.toString() // We can store ID in a string
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
```

Last, we call the custom method like any other methods such as `find()` or `save()`. The more we use this custom in our code the more the benefit of the code reuse and this pattern. Important to notice the `toArray()` method for the `find()` because `documents` must be an array.

```javascript
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
```

Mongoskin is a subset of the native Node.js MongoDB driver, so most of the methods as you have observed from the latter are available in the former. For example `find()`, `findOne()`, `update()`, `save()` and `remove(). They are from the native MongoDB driver and they are available in the Mongoskin straight up. But there are more methods. Here is the list of the main Mongoskin–only methods:

- `findItems(..., callback)`: finds elements and returns an array instead of a cursor
- `findEach(..., callback)`: iterates through each found element
- `findById(id, ..., callback)`: finds by `_id` in a string format
- `updateById(_id, ..., callback)`: updates an element with a matching `_id`
- `removeById(_id, ..., callback)`: removes an element with a matching `_id`

Of course there are alternatives. The alternatives to the native MongoDB driver and Mongoskin include but not limited to:

- `mongoose`: an asynchronous JavaScript driver with optional support for modeling
- `mongolia`: a lightweight MongoDB ORM/driver wrapper
- `monk`: a tiny layer that provides simple yet substantial usability improvements for MongoDB use within Node.js


Data validation is super important. Most of the MongoDB libraries will require developers to create their own validation with Mongoose being an exception. Mongoose has a built-in data validation. Thus for data validation at the Express level, these modules are often used:

- `node-validator`: validates data
- `express-validator`: validates data in Express.js 3/4

It is time to utilize our skills and build something interesting with MongoDB by enhancing our blog project.

# Project: Storing Blog Data in MongoDB with Mongoskin

Let&#39;s now return to our Blog project. I&#39;ve split this feature of storing Blog data in MongoDB with Mongoskin into the following three tasks:

1. Adding MongoDB seed data
2. Writing Mocha tests
3. Adding persistence

The task numero uno is to populate the database with some test data.

## Project: Adding MongoDB Seed Data

First of all, it&#39;s not much fun to enter data manually each time we test or run an app. So, in accordance with the Agile principles, we can automate this step by creating a Bash seed data script `db/seed.sh`:

```
mongoimport --db blog --collection users --file ./db/users.json –jsonArray
mongoimport --db blog --collection articles --file ./db/articles.json --jsonArray
```

This script uses MongoDB&#39;s `mongoimport` feature, which inserts data conveniently into the database straight from JSON files.

The `users.json` file contains information about authorized users:

``` js
[{
  "email": "hi@azat.co",
  "admin": true,
  "password": "1"
}]
```

Here some of the content of he `articles.json` file which has the seed content of the blog posts and testing (please use the file provided in GitHub instead of typing from the book):

``` js
[ 
  {
    "title": "Node is a movement",
    "slug": "node-movement",
    "published": true,
    "text": "In one random deployment, it is often assumed that the number of scattered sensors are more than that required by the critical sensor density. Otherwise, complete area coverage may not be guaranteed in this deployment, and some coverage holes may exist. Besides using more sensors to improve coverage, mobile sensor nodes can be used to improve network coverage..."
  }, {
    "title": "Express.js Experience",
    "slug": "express-experience",
    "text": "Work in progress",
    "published": false
  }, {
    "title": "Node.js FUNdamentals: A Concise Overview of The Main Concepts",
    "slug": "node-fundamentals",
    "published": true,
    "text": "Node.js is a highly efficient and scalable nonblocking I/O platform that was built on top of a Google Chrome V8 engine and its ECMAScript. This means that most front-end JavaScript (another implementation of ECMAScript) objects, functions, and methods are available in Node.js. Please refer to JavaScript FUNdamentals if you need a refresher on JS-specific basics."
  }
]
```

To populate our seed data, simply run `$ ./db/seed.sh` from the project folder.

## Project: Writing Mocha Tests

If you remember, Mocha uses `describe` for test suites and `it` for test cases. Thus, the test file `code/ch5/blog-express/tests/index.js` has this structure at a high level:

```js
// Import/require statements

describe('server', () => {
  
  before(() => {
    boot()
  })

  describe('homepage', () => {

    it('should respond to GET', (done) => {
      // ...
    })

    it('should contain posts', (done) => {
      // ...
    })

  })

  describe('article page', () => {

    it('should display text or 401', (done) => {
      // ...
    })

  })
  
  after(() => {
    shutdown()
  })

})
```

Let's start the implementation with import/require statement (import not in a sense we are using ES6 `import` statement but in a sense that `require()` method imports). 

```js
const boot = require('../app').boot
const shutdown = require('../app').shutdown
const port = require('../app').port
const superagent = require('superagent')
const expect = require('expect.js')
```

Next, we can import test data from seed files via `require` because it&#39;s a JSON format:

```js
const seedArticles = require('../db/articles.json')
```

Let&#39;s add this test to the home page suite to check whether our app shows posts from seed data on the front page:

```js
    it('should contain posts', (done) => {
      superagent
        .get(`http://localhost:${port}`)
        .end((error, res) => {
          expect(error).to.be(null)
          expect(res.text).to.be.ok
          seedArticles.forEach((item, index, list) => {
            if (item.published) {
              expect(res.text).to.contain(`<h2><a href="/articles/${item.slug}">${item.title}`)
            } else {
              expect(res.text).not.to.contain(`<h2><a href="/articles/${item.slug}">${item.title}`)
            }
          })
          done()
        })
    })
```

In a new-article page suite, let&#39;s test for presentation of the text with `contains`:

```js
  describe('article page', () => {
    it('should display text or 401', (done) => {
      let n = seedArticles.length
      seedArticles.forEach((item, index, list) => {
        superagent
          .get(`http://localhost:${port}/articles/${seedArticles[index].slug}`)
          .end((error, res) => {
            if (item.published) {
              expect(error).to.be(null)
              expect(res.text).to.contain(seedArticles[index].text)
            } else {
              expect(error).to.be.ok
              expect(res.status).to.be(401)
            }
            // console.log(item.title)
            if (index + 1 === n) {
              done()
            }
          })
      })
    })
  })
```  

To make sure that Mocha doesn&#39;t quit earlier than `superagent` calls the response callback, we implemented a countertrick. Instead of it, you can use async. The full source code is in the file `tests/index.js` under `ch5` folder.

Running tests with either `$ make test` or `$ mocha test` should fail miserably, but that&#39;s expected because we need to implement persistence and then pass data to Pug templates, which we wrote in the previous chapter.

## Project: Adding Persistence

This example builds on the previous chapter, with the chapter 3 having the latest code (chapter 4 code is in ch5). Let&#39;s go back to our `ch3` folder, and add the tests, duplicate them, and then start adding statements to the `app.js` file.

The full source code of this example is available under `ch5` folder. First, the dependencies inclusions need to be reformatted to utilize Mongoskin:

```js
const express = require('express')
const routes = require('./routes')
const http = require('http')
const path = require('path')
const mongoskin = require('mongoskin')
const dbUrl = process.env.MONGOHQ_URL || 'mongodb://@localhost:27017/blog'

const db = mongoskin.db(dbUrl)
const collections = {
  articles: db.collection('articles'),
  users: db.collection('users')
}
```

These statements are needed for the Express.js middleware modules to enable logging (`morgan`), error handling (`errorhandler`), parsing of the incoming HTTP request bodies (`body-parser`) and to support clients which do not have all HTTP methods (`method-override`):

```js
const logger = require('morgan')
const errorHandler = require('errorhandler')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
```

Then, we create of an Express.js instance and assigning the title to use this title in the templates:

```js
const app = express()
app.locals.appTitle = 'blog-express'
```

Now, we add a middleware that exposes Mongoskin/MongoDB collections in each Express.js route via the `req` object. It's called a decorator pattern. You can learn more about the decorator pattern as well as other Node patterns in my online course [Node Patterns: From Callbacks to Observer](https://node.university/p/node-patterns). The idea is to have `req.collections` in all other subsequent middleware and routes. It's done with this code. And don&#39;t forget to call `next()` in the middleware; otherwise, each request will stall.

```js
app.use((req, res, next) => {
  if (!collections.articles || !collections.users) return next(new Error('No collections.'))
  req.collections = collections
  return next()
})
```

Next, we define the Express settings. We set up port number and template engine configurations to tell Express what folder to use for templates (views) and what template engine to use to render those templates (pug):

```js
app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
```

Now the usual suspects, `app.use()` statement to plug-in the Express middleware modules. The functionality of most of which should be already familiar to you. The functionality includes logging of requests, parsing of JSON input, using Stylus for CSS and serving of static content. I like to remain disciplined and use `path.join()` to construct cross-platform absolute paths out of relative folder names so that there's a guarantee the paths will work on Windows.

```js
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(methodOverride())
app.use(require('stylus').middleware(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'public')))
```

For development, we use the standard Express.js error handler that we imported earlier with `require()`:

```js
if (app.get('env') === 'development') {
  app.use(errorHandler('dev'))
}
```

The next sections of the `app.js` file deals with the server routes. So, instead of a single catch-all `*` route in the ch3 examples, we have the following GET, and POST routes (that mostly render HTML from Pug templates):

```js
app.get('/', routes.index)
app.get('/login', routes.user.login)
app.post('/login', routes.user.authenticate)
app.get('/logout', routes.user.logout)
app.get('/admin', routes.article.admin)
app.get('/post', routes.article.post)
app.post('/post', routes.article.postArticle)
app.get('/articles/:slug', routes.article.show)
```

REST API routes are used mostly for the admin page. That&#39;s where our fancy AJAX browser JavaScript will need them. They use GET, POST, PUT and DELETE methods and don&#39;t render HTML from Pug templates, but instead output JSON:

```js
app.get('/api/articles', routes.article.list)
app.post('/api/articles', routes.article.add)
app.put('/api/articles/:id', routes.article.edit)
app.delete('/api/articles/:id', routes.article.del)
```

In the end, we have a 404 catch-all route. It&#39;s a good practice to account for the cases when users type a wrong URL. If the request makes to this part of the configuration (top to bottom order), we return the &quot;not found&quot; status:

```js
app.all('*', (req, res) => {
  res.status(404).send()
})
```

The way we start the server is the same as in Chapter 3 which means we determine if this file is loaded by another file. In this case, we export the server object. If not, then we proceed to launch the server directly with `server.listen()`.

```js
const server = http.createServer(app)
const boot = function () {
  server.listen(app.get('port'), function () {
    console.info(`Express server listening on port ${app.get('port')}`)
  })
}
const shutdown = function () {
  server.close(process.exit)
}
if (require.main === module) {
  boot()
} else {
  console.info('Running app as a module')
  exports.boot = boot
  exports.shutdown = shutdown
  exports.port = app.get('port')
}
```

Again, for your convenience, the full source code of `app.js` is under `ch5/blog-example` folder.

We must add `index.js`, `article.js`, and `user.js` files to the `routes` folder, because we need them in `app.js`. The `user.js` file is bare bones for now (we add authentications in Chapter 6).

The method for the GET `/users` route, which should return a list of existing users (which we implement later) is as follows:

```js
exports.list = (req, res, next) => {
  res.send('respond with a resource')
}
```

The method for the GET `/login` page route that renders the login form (`login.pug`) is as follows:

```js
exports.login = (req, res, next) => {
  res.render('login')
}
```

The method for the GET `/logout` route that eventually destroys the session and redirects users to the home page (to be implemented) is as follows:

```js
exports.logout = (req, res, next) => {
  res.redirect('/')
}
```

The method for the POST `/authenticate` route that handles authentication and redirects to the admin page (to be implemented) is as follows:

```js
exports.authenticate = (req, res, next) => {
  res.redirect('/admin')
}
```

The full code of `user.js` is in `code/ch5/blog-example/routes`. We will add more logic to `user.js` later. Now the most database action happens in the `article.js` routes.

Let&#39;s start with the GET article page where we call `findOne` with the slug from the `req.params` object:

```js
exports.show = (req, res, next) => {
  if (!req.params.slug) return next(new Error('No article slug.'))
  req.collections.articles.findOne({slug: req.params.slug}, 
    (error, article) => {
      if (error) return next(error)
      if (!article.published) return res.status(401).send()
      res.render('article', article)
  })
}
```

The GET articles API route (used in the admin page), where we fetch all articles with the `find` method and convert the results to an array before sending them back to the requestee:

```js
exports.list = (req, res, next) => {
  req.collections
    .articles
    .find({})
    .toArray((error, articles) => {
      if (error) return next(error)
      res.send({articles: articles})
  })
}
```

The POST article API routes (used in the admin page), where the `insert` method is used to add new articles to the `articles` collection and to send back the result (with `_id` of a newly created item):

```js
exports.add = (req, res, next) => {
  if (!req.body.article) return next(new Error('No article payload.'))
  let article = req.body.article
  article.published = false
  req.collections.articles.insert(article, 
    (error, articleResponse) => {
      if (error) return next(error)
      res.send(articleResponse)
  })
}
```

The PUT article API route (used on the admin page for publishing), where the `updateById` shorthand method is used to set the article document to the payload of the request (`req.body`). (The same thing can be done with a combination of `update` and `_id` query.)

```js
exports.edit = (req, res, next) => {
  if (!req.params.id) return next(new Error('No article ID.'))
  req.collections.articles.updateById(req.params.id, 
    {$set: req.body.article}, 
    (error, count) => {
      if (error) return next(error)
      res.send({affectedCount: count})
  })
}
```

The DELETE article API which is used on the admin page for removing articles in which, again, a combination of `remove` and `_id` can be used to achieve similar results:

```js
exports.del = (req, res, next) => {
  if (!req.params.id) return next(new Error('No article ID.'))
  req.collections.articles.removeById(req.params.id, (error, count) => {
    if (error) return next(error)
    res.send({affectedCount: count})
  })
}
```

The GET `/article` post page. This page is a blank form and thus requires NO data:

```js
exports.post = (req, res, next) => {
  if (!req.body.title) { res.render('post') }
}
```

Next, there&#39;s the POST article route for the post page form (the route that actually handles the post addition). In this route we check for the non-empty inputs (`req.body`), construct `article` object and inject it into the database via `req.collections.articles` object exposed to us by middleware. Lastly, we render HTML from the `post` template:

```js
exports.postArticle = (req, res, next) => {
  if (!req.body.title || !req.body.slug || !req.body.text) {
    return res.render('post', {error: 'Fill title, slug and text.'})
  }
  const article = {
    title: req.body.title,
    slug: req.body.slug,
    text: req.body.text,
    published: false
  }
  req.collections.articles.insert(article, (error, articleResponse) => {
    if (error) return next(error)
    res.render('post', 
      {error: 'Article was added. Publish it on Admin page.'})
  })
}
```

The `GET admin page` route in which we fetch sorted articles (`{sort: {_id:-1}}`) and manipulate them:

```js
exports.admin = (req, res, next) => {
  req.collections
    .articles.find({}, {sort: {_id: -1}})
    .toArray((error, articles) => {
      if (error) return next(error)
      res.render('admin', {articles: articles})
  })
}
```

**Note**  In real production apps that deal with thousands of records, programmers usually use pagination by fetching only a certain number of items at once (5, 10, 100, and so on). To do this, use the `limit` and `skip` options with the `find` method, e.g., HackHall example: <https://github.com/azat-co/hackhall/blob/master/routes/posts.js#L37>.

This time we won't duplicate the code since it's rather long. So for the full code of `article.js` please refer to the `code/ch5/blog-example/routes`. 

From the project section in Chapter 4, we have the `.pug` files under the `views` folder. Lastly, the `package.json` file looks as follows. Please compare your npm scripts and dependencies.

```js
{
  "name": "blog-express",
  "version": "0.0.5",
  "private": true,
  "scripts": {
    "start": "node app.js",
    "seed": "sh ./seed.sh",
    "test": "make test",
    "st": "standard app.js && standard tests/index.js && standard routes/*"
  },
  "dependencies": {
    "body-parser": "1.18.2",
    "cookie-parser": "1.4.3",
    "errorhandler": "1.5.0",
    "express": "4.16.2",
    "express-session": "1.15.6",
    "method-override": "2.3.10",
    "mongodb": "2.2.33",
    "mongoskin": "2.1.0",
    "morgan": "1.9.0",
    "pug": "2.0.0-rc.4",
    "serve-favicon": "2.4.5",
    "stylus": "0.54.5"
  },
  "devDependencies": {
    "standard": "10.0.3",
    "mocha": "4.0.1",
    "superagent": "3.8.0",
    "expect.js": "0.3.1"
  }
}
```

For the admin page to function, we need to add some AJAX-iness in the form of the `js/admin.js` file under the `public` folder. (I don't know why I keep calling HTTP requests done with the XHR object, the AJAX calls since AJAX is Asynchronous JavaScript And XML and no one is using XML anymore.)

In this file, we use `ajaxSetup` to configure all requests because these configs will be used in many requests. Most importantly, `withCredentials` will send the cookies which is needed for admin authentication.

```js
$.ajaxSetup({
  xhrFields: {withCredentials: true},
  error: function (xhr, status, error) {
    $('.alert').removeClass('hidden')
    $('.alert').html('Status: ' + status + ', error: ' + error)
  }
})
```

The function `findTr` is a helper that we can use in our event handlers:

```js
var findTr = function (event) {
  var target = event.srcElement || event.target
  var $target = $(target)
  var $tr = $target.parents('tr')
  return $tr
}
```

Overall, we need three event handlers to remove, publish, and unpublish an article. This following code snippet is for removing, and it simply sends a request to our Node.js API route `/api/articles/:id`, which we wrote a page or two ago:

```js
var remove = function (event) {
  var $tr = findTr(event)
  var id = $tr.data('id')
  $.ajax({
    url: '/api/articles/' + id,
    type: 'DELETE',
    success: function (data, status, xhr) {
      $('.alert').addClass('hidden')
      $tr.remove()
    }
  })
}
```

Publishing and unpublishing are coupled together, because they both send `PUT` to `/api/articles/:id` but with different payloads (`data`). Then type is of course `PUT`. The data is turned into a string because that is what this method `$.ajax` uses. If we were to use a different library like [axios](https://npmjs.org/axios) or [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) then the actual data format and the syntax of the call to make the request will be different. An interesting feature is coded in the callback. It allows to change the icons depending on the status of a particular article (`data.published`).

```js
var update = function (event) {
  var $tr = findTr(event)
  $tr.find('button').attr('disabled', 'disabled')
  var data = {
    published: $tr.hasClass('unpublished')
  }
  var id = $tr.attr('data-id')
  $.ajax({
    url: '/api/articles/' + id,
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({article: data}),
    success: function (dataResponse, status, xhr) {
      $tr.find('button').removeAttr('disabled')
      $('.alert').addClass('hidden')
      if (data.published) {
        $tr.removeClass('unpublished').find('.glyphicon-play').removeClass('glyphicon-play').addClass('glyphicon-pause')
      } else {
        $tr.addClass('unpublished').find('.glyphicon-pause').removeClass('glyphicon-pause').addClass('glyphicon-play')
      }
    }
  })
}
```

That's not all. Defining functions won't make them work when a user clicks on a button. We need to attach event listeners. We attach event listeners in the `ready` callback to make sure the the `tbody` is in the DOM, otherwise it might be not found.

```js
$(document).ready(function () {
  var $element = $('.admin tbody')
  $element.on('click', 'button.remove', remove)
  $element.on('click', 'button', update)
})
```

The full source code of the front-end `admin.js` file is in `code/ch5/blog-example/public/js`. And now is the time to run the app!

## Running the App

To run the app, simply execute `$ npm start` which will execute `$ node app.js`, but if you want to seed and test it, execute `$ npm run seed` which will execute `$ make db`. To run tests, use `$ npm test` which executes `$ make test`, respectively (Figure 5-5). (There's no difference between running npm script commands or the commands directly.) 



![alt](media/image5.png)

***Figure 5-5.** The results of running Mocha tests*

Oh yeah. Don&#39;t forget that `$ mongod` service must be running on the localhost and port 27017. The expected result is that all tests now pass (hurray!), and if users visit <http://localhost:3000>, they can see posts and even create new ones on the admin page (<http://localhost:3000/admin>) as shown in Figure 5-6.

![alt](media/image6.png)

***Figure 5-6.** The admin page with seed data*

Of course, in real life, nobody leaves the admin page open to the public. Therefore, in Chapter 6 we&#39;ll implement session-based authorization, and password and OAuth authentications.

# Summary

In this chapter we learned how to install MongoDB, and use its console and native Node.js driver, for which we wrote a small script and refactored it to see Mongoskin in action. Last, we wrote tests, seeded scripts, and implemented the persistence layer for Blog. In the next chapter, we&#39;ll implement authorization and authentication.


# Dedication

To Vladimir Nabokov and The Defense

# About the Author

Azat works in technology leadership at Indeed.com, the world leader in job search. Azat is a JavaScript/Node.js expert with dozens of published online courses on Node University, edX and Udemy, and books including much praised top-sellers such as React Quickly (Manning, 2017), Full Stack JavaScript (Apress, 2015), *Practical Node.js* (Apress, 2014), Pro Express.js (Apress, 2014) and many others. 

Two of Azat's self-published books, Rapid Prototyping with JS and Express.js Guide, became best-sellers on Amazon in their categories before being revised and published by a prestigious well-regarded professional technical publisher Apress Media. 

In 2016 alone, Azat spoke at over a dozen of tech conferences including JSConf, Node Summit, NDC, Node Interactive, ConFoo, ForwardJS, All Things Open, GDG DevFest, Great Wide Open and many others. Over the years, Azat shared a speaking platform with prominent software gurus such as Douglas Crockford, Christian Heilmann, Jeff Atwood, Dan Shaw, Mikeal Rogers, John Papa, Axel Rauschmayer, Kyle Simpso, Samer Buna, James Halliday, Maxwell Ogden, Rey Bango and many others.

Azat is an ex-Technology Fellow at Capital One which is one of the top 10 US banks. At various times, Azat worked as a software engineers, and a technology leader in different organizations including the US federal government agencies, Fortune 200 companies, small startups and medium-sized corporations. During his career, Azat worked in the same teams with prominent tech people such as Raquel Vélez (first engineer at npm), Jim Jagielski (founder of Apache Foundation), Bobby Calderwood (contributor to ClojureScript) and Mitch Pirtle (co-founder of Joomla!).

Azat taught in-person and face-to-face over a thousand of software engineers of prominent US and world-wide corporations including Cisco, Walmart, Starbucks, Michael Kors, Salesforce, 20th Century Fox / Fox Studios, VMWare, Capital One, OnDeck, Northwestern Mutual, Capital One, OnDeck, HubSpot, UC Davis, The University of Arizona, Intuit, DocuSign, Intuit, Macy's, Twilio, The Orchard and Apple.

Currently in his spare time from work time, Azat enjoys a cup of Americano with ghee while recording videos for Node University, where thousands of developers sharpen and master their Node skills.


# Acknowledgement

Thank you to the supporters of my Kickstarter campaign. Without you I probably would have not worked on this release so hard and maybe not worked at all. You are AWESOME because you made this new edition a reality and not only that but you have made this edition and previous edition available on GitHub for the entire world to read and learn Node which is the greatest technology for building web applications ever. 

In particular, very great many thanks to individual Kickstarter supporters (who will soon get the signed print books and other rewards or maybe already have them): Matthew Amacker, Jordan Horiuchi, Tim Chen, Alexey Bushnev, Aleksey Maksimov, Maurice van Cooten, Ryan, Ng Yao Min, Kommana Karteek, Elias Yousef, Arhuman, Javier Armendariz, Dave Anderson, Edithson Abelard. You guys are brilliant!

I cannot not mention the biggest supporter DevelopIntelligence which is one of the best is not the best tech training companies (<http://www.developintelligence.com>). So if you need to train your software engineers in... anything! Then email them. Seriously, Develop Intelligence has been around for 20+ years, and they have great teachers with great technical classes. I was one of their instructors so I know. :)

I convey my gratitude to all the wonderful people I have encountered during my software engineering career.  These people supported, mentored, and trusted me with new challenges, helped me to  find mistakes, and pushed my limits.

Of course, this book wouldn’t be possible without the assistance, research, and championing done by my wonderful Apress editors. I especially thank Louise Corrigan, Ben Renow-Clarke, Christine Ricketts, James Markham, Cat Ohala, and Peter Elst.

Also, many thanks and appreciation go to the readers who kindly provided feedback to the first edition of *Practical Node.js*, my Webapplog.com (http://webapplog.com) blog posts, and my prior books.

# Introduction

There are more and more books and online resources being published that cover Node.js basics (e.g., how-to’s of Hello World and simple apps). For the most part, these tutorials rely on core modules only or maybe one or two Node Package Manager (npm) packages. This “sandbox” approach of tutorials is easy and doesn’t require many dependencies, but it can’t be further from the actual Node.js stack.  This is especially true with Node.js, the core of which—by design—is kept lean and minimal. At the same time, the vast “userland” (i.e., npm) provides an ecosystem of packages/modules to serve specific granular purposes. Therefore, there is a need to show electively how Node.js
is used in the industry and to have it all in one place—the all-encompassing practical resource that can be used as a learning tool, a code cookbook, and a reference.


# What This Book Is and Is Not: IMPORTANT TO KNOW BEFORE BUYING

Practical Node.js: Building Real-World Scalable Web Apps is a hands-on manual for developing production-ready web applications and services by leveraging the rich ecosystem of Node.js packages. This is important because real applications require many components, such as security, deployment, code organization, database drivers, template engines, and more. This is why we include extensive 12-chapter coverage of third-party services, command-line tools, npm modules, frameworks, and libraries.

Just to give you some idea, *Practical Node.js* is a one-stop place for getting started with Express.js 4, Hapi.js, DerbyJS, Mongoskin, Mongoose, Everyauth, Mocha, Jade, Socket.IO, TravisCI, Heroku, Amazon Web Services (AWS), and many others. Most of these items are vital for any serious project.

In addition, we create a few projects by building, step by step, from a straightforward concept to a more complicated application. These projects can also serve as a boilerplate for jump-starting your own development efforts. Also, the examples show industry best practices to help you avoid costly mistakes.

Last but not least, many topics and chapters serve as a reference to which you can always return later when you’re faced with a challenging problem.

*Practical Node.js* aims to save you time and make you a more productive Node.js programmer!

Although the entire first chapter is dedicated to installations and a few important differences between Node.js and browser JavaScript, we didn’t want to dilute the core message of making production-ready apps, or make *Practical Node.js* even larger and more convoluted. Therefore, **the book is not a beginner’s guide** and there is no extensive immersion into the inner workings of the Node.js platform and its core modules.

We also can’t guarantee that each component and topic are explained to the extent you need, because the nature of your project might be very specific. Most chapters in the book help you to get started with the stack. There is simply no realistic way to fit so many topics in one book and cover them comprehensively.

Another caveat of this book (or virtually any other programming book) is that the versions of the packages we use will eventually become obsolete. Often, this isn’t an issue because, in this book, versions are stated and locked explicitly. So no matter what, **the examples will continue to work with book's versions**.

Even if you decide to use the latest versions, in many cases this still might not be an issue, because essentials remain the same. However, if you go this off-path route, once in a while you might be faced with a breaking change introduced by the latest versions.


# Who Can Benefit from This Book

*Practical Node.js* is an intermediate- to advanced-level book on programming with Node.js. Consequently, to get the most out of it, you need to have prior programming experience and some exposure to Node.js. We assume readers’ prior knowledge of computer science, programming concepts, web development, Node.js core modules, and the inner workings of HTTP and the Internet.

However, depending on your programming level and ability to learn, you can fill in any knowledge gaps very quickly by visiting links to official online documentations and reading external resources referenced in this book. Also, if you have a strong programming background in some other programming language, it would be relatively easy for you to start Node.js development with *Practical Node.js*.

As mentioned earlier, *Practical Node.js* is written for intermediate and advanced software engineers. For this reason, there are there categories of programmers who can benefit from it the most:

1. Generalist or full-stack developers including development operation (DevOps) and quality assurance (QA) automation engineers
1. Experienced front-end web developers with a strong background and understanding of browser JavaScript
1. Skilled back-end software engineers coming from another languages such as Java, PHP, and Ruby, who don’t mind doing some extra work get up to speed with the JavaScript language”

# What You’ll Learn

*Practical Node.js* takes you from an overview of JavaScript and Node.js basics, installing all the necessary modules to writing and deploying web applications, and everything in between. We cover libraries including, but not limited to, Express.js 4 and Hapi.js frameworks, Mongoskin and the Mongoose object-relational mapping (ORM) library for the MongoDB database, Jade and Handlebars template engines, OAuth and Everyauth libraries for OAuth integrations, the Mocha testing framework and Expect test-driven development/behavior-driven development language, and the Socket.IO and DerbyJS libraries for WebSocket real-time communication.
In the deployment chapters (10 and 11), the book covers how ”

In the deployment chapters (10 and 11), the book covers how to use Git and deploy to Heroku, as well as examples of how to deploy to AWS, daemonize apps, and use Nginx, Varnish Cache, Upstart, init.d, and the forever module.

The hands-on approach of this book walks you through iterating on the Blog project in addition to many other smaller examples. You’ll build database scripts, representational state transfer (RESTful) application programming interfaces (APIs), tests, and full-stack apps all from scratch. You’ll also discover how to write your own Node.js modules and publish them on npm.
*Practical Node.js* will show you how to do the following:

* Build web apps with Express.js 4, MongoDB, and the Jade template engine
* Use various features of Jade and Handlebars
* Manipulate data from the MongoDB console
* Use the Mongoskin and Mongoose ORM libraries for MongoDB
* Build REST API servers with Express.js 4 and Hapi.js
* Test Node.js web services with Mocha, Expect, and TravisCI
* Use token and session-based authentication
* Implement a third-party (Twitter) OAuth strategy with Everyauth
* Build WebSocket apps using Socket.IO and DerbyJS libraries
* Prepare code for production with Redis, Node.js domains, and the cluster library using tips and best practices
* Deploy apps to Heroku using Git
* Install necessary Node.js components on an AWS instance
* Configure Nginx, Upstart, Varnish, and other tools on an AWS instance
* Write your own Node.js module and publish it on npm

You already know what Node.js is; now, learn what you can do with it and how far you can take it.

# Why You Should Read This Book

*Practical Node.js* was designed to be one stop for going from Hello World examples to building apps in a professional manner. You get a taste of the most widely used Node.js libraries in one place, along with best practices and recommendations based on years of building and running Node.js apps in production. The libraries covered in *Practical Node.js* greatly enhance the quality of code and make you more productive. Also, although the material in this book is not groundbreaking, the convenience of the format saves hours of frustration researching the Internet. Therefore, *Practical Node.js* is here to help you to jump-start your Node.js development!



# Notation

The book and all its source code follow StandardJS (<https://standardjs.com>) coding style. When it comes to showing the code in the book, this book follows a few formatting conventions. Code is in monospace font. For example this is inline code, `var book = {name: 'Practical Node.js'};`, while this is a code listing:

```js
server.on('stream', (stream, headers) => {
  // Stream is a Duplex
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  })
  stream.end('<h1>Hello World</h1>')
})
```

Unfortunately, books are narrower than infinite code editor windows. That's why some code formatting in books might be different than StandardJS, i.e., have more line breaks. 

For this reason, in the code listings be especially careful with maintaining proper syntax, avoiding typos and not having extra line breaks. If in doubt, always refer to the GitHub source code instead of relying on the book because the GitHub  source code will always have a more proper formatting (StandardJS) and might even contain a bug fix which sneaked in the book code listing. 

If the code begins with $, this code is meant to be executed in the terminal/command line. However, if the code line starts with >, the code is meant for the virtual environment (aka, console—either Node.js or MongoDB). If the Node.js module name is in code font, this is the npm name and you can use it with npm and the `require()` method, such as `superagent`.

# Source Code

Learning is more effective when we apply our knowledge right away. For this reason, virtually every chapter in *Practical Node.js* ends with a hands-on exercise. For your convenience, and because we believe in open source and transparency, all the book’s examples are available publicly (i.e., free of charge) for exploration and execution on GitHub at <https://github.com/azat-co/practicalnode>.

# Errata and Contacts

If you spot any mistakes or typos (and I’m sure you will), please open an issue or, even better, fix it and make a pull request to the GitHub repository of the book’s examples at <https://github.com/azat-co/practicalnode>. For all other updates and contact information, the canonical home of *Practical Node.js* on the Internet is <http://practicalnodebook.com>.

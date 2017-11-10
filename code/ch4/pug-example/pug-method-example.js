const pug = require('pug')

const pugTemplate = `// content goes here
p Node.js is a non-blocking I/O for scalable apps.
//- @todo change this to a class
p(id="footer") Copyright 2014 Azat`


const htmlString = pug.render(pugTemplate, {pretty: true})
console.log(htmlString)

const pugTemplate2 = `doctype html
html(lang="en")
  head
    title Why JavaScript is Awesome | CodingFear: programming and human circumstances
    script(type='text/javascript').
      const a = 1
      console.log(\`Some JavaScript code here and the value of a is \${a}\`)
  body
    h1 Why JavaScript is Awesome
    #container.col
      p You are amazing
      p Get on it!
      p.
        JavaScript is fun. Almost everything 
        can be written in JavaScript. It is huge.`


const htmlString2 = pug.render(pugTemplate2, {pretty: true})
console.log(htmlString2)


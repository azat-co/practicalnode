const pug = require('pug')

const pugTemplate = `body
  div
    h1 Practical Node.js
    p The only book most people will ever need.
  div
    footer &copy; Apress`


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


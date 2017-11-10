const pug = require('pug'),
  fs = require('fs')

let data = {
  title: 'Practical Node.js',
  author: {
    twitter: '@azat_co',
    name: 'Azat'
  },
  tags: ['express', 'node', 'javascript']
}
data.body = process.argv[2]

fs.readFile('pug-example.pug', 'utf-8', (error, source) => {
  let template = pug.compile(source)
  let html = template(data)
  console.log(html)
})

//pug.render

// fs.readFile('pug-example.pug', 'utf-8', (error, source) => {
//   const html = pug.render(source, data)
//   console.log(html)
// })

//pug.renderFile

// pug.renderFile('pug-example.pug', data, (error, html) => {
//   console.log(html)
// })

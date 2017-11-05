const handlebars = require('handlebars'),
  fs = require('fs'),
  path = require('path')

const data = {
  title: 'practical node.js',
  author: '@azat_co',
  tags: ['express', 'node', 'javascript']
}
data.body = process.argv[2]
const filePath =path.join(__dirname,
  'handlebars-example.html')
  
fs.readFile(filePath, 'utf-8', function(error, source){
  handlebars.registerHelper('custom_title', function(title){
    var words = title.split(' ')
    for (var i = 0; i < words.length; i++) {
      if (words[i].length > 4) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1)
      }
    }
    title = words.join(' ')
    return title
  })
  var template = handlebars.compile(source)
  var html = template(data)
  console.log(html)
})

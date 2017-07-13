var jade = require('jade'),
  fs = require('fs');

var data = {
  title: 'Practical Node.js',
  author: {
    twitter: '@azat_co',
    name: 'Azat'
  },
  tags: ['express', 'node', 'javascript']
}
data.body = process.argv[2];

fs.readFile('jade-example.jade', 'utf-8', function(error, source){
  var template = jade.compile(source);
  var html = template(data)
  console.log(html)
});

//jade.render

// fs.readFile('jade-example.jade', 'utf-8', function(error, source){
//   var html = jade.render(source, data)
//   console.log(html)
// });

//jade.renderFile

// jade.renderFile('jade-example.jade', data, function(error, html){
//   console.log(html)
// });

var jade = require('jade'),
  fs = require('fs');

fs.readFile('jade-example.jade', 'utf-8', function(error, template){
  var jadeSample = jade.compile(template);
  var data = {
    title: "Practical Node.js",
    author: "@azat_co",
    tags: ['express', 'node', 'javascript']
  }
  data.body = process.argv[2];
  var html = jadeSample(data)
  console.log(html)
});

//jade.render
// var jade = require('jade'),
//   fs = require('fs');

// fs.readFile('jade-example.jade', 'utf-8', function(error, template){
//   var data = {
//     title: "Practical Node.js",
//     author: "@azat_co",
//     tags: ['express', 'node', 'javascript']
//   }
//   data.body = process.argv[2];
//   var html = jade.render(template, data)
//   console.log(html)
// });

//jade.renderFile

// var jade = require('jade'),
//   fs = require('fs'),
//   data = {
//     title: "Practical Node.js",
//     author: "@azat_co",
//     tags: ['express', 'node', 'javascript']
//   };
// data.body = process.argv[2];
// jade.renderFile('jade-example.jade', data, function(error, html){
//   console.log(html)
// });
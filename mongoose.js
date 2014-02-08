var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var Book = mongoose.model('Book', { name: String });

var practicalNodeBook = new Book({ name: 'Practical Node.js' });
practicalNodeBook.save(function (err, results) {
  if (err) {
    console.error(e);
    process.exit(1);
  } else {
    console.log('Saved: ', results);
    process.exit(0);
  }
});
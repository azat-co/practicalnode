var crypto = require('crypto'),
  email = "Hi@azat.co "

email = email.trim()
email = email.toLowerCase()

var url = crypto.createHash('md5').update(email).digest('hex')
console.log(url)
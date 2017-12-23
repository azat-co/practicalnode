const fs = require('fs')


function* readJSON(filename, enc='utf8'){
  const caller = yield
  fs.readFile(filename, enc, function (err, res){
      if (err) caller.failure(err)
      else {
        try {
          caller.success(JSON.parse(res))
        } catch (ex) {
          caller.failure(ex)
        }
      }
    }) 
}

const gen = readJSON('./package.json')

console.log(gen.next())
console.log(gen.next())
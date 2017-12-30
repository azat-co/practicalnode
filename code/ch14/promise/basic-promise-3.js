const fs = require('fs')
function readFilePromise( filename ) {
	let _callback = () => {}
	let _errorCallback = () => {}

	fs.readFile(filename, (error, buffer) => {
		if (error) _errorCallback(error)
		else _callback(buffer)
	})

	return {
		then( cb, errCb ){
			_callback = cb
			_errorCallback = errCb
		}
	}

}

// readFilePromise('package.json').then( buffer => {
//   console.log( buffer.toString() )
//   process.exit(0)
// }, err => {
//   console.error( err )
//   process.exit(1)
// })

readFilePromise('package.jsan').then( buffer => {
  console.log( buffer.toString() )
  process.exit(0)
}, err => {
  console.error( err )
  process.exit(1)
})
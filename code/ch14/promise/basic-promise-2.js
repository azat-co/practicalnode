function myAsyncTimeoutFn(data) {

	let _callback = null

	setTimeout( () => {

		if ( _callback ) _callback()
	}, 1000)

	return {
		then(cb){
			_callback = cb
		}
	}

}

myAsyncTimeoutFn('just a silly string argument').then(() => {
	console.log('Final callback is here')
})
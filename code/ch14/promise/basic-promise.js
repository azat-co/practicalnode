function myAsyncTimeoutFn(data, callback) {
	setTimeout(() => {
		callback()
	}, 1000)
}

myAsyncTimeoutFn('just a silly string argument', () => {
	console.log('Final callback is here')
})
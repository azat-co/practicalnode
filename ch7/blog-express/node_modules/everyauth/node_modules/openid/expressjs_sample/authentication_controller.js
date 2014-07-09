var openid = require('openid');

var relyingParty = new openid.RelyingParty(
    'http://localhost:8888/login/verify', // Verification URL (yours)
    null, // Realm (optional, specifies realm for OpenID authentication)
    false, // Use stateless verification
    false, // Strict mode
    []); // List of extensions to enable and include

app.get('/login', function(request, response) {
	response.render('login');
});

app.get('/login/authenticate', function(request, response) {
	var identifier = request.query.openid_identifier;

	// Resolve identifier, associate, and build authentication URL
	relyingParty.authenticate(identifier, false, function(error, authUrl) 	{
		if (error) {
			response.writeHead(200);
			response.end('Authentication failed: ' + error.message);
		}
		else if (!authUrl) {
			response.writeHead(200);
			response.end('Authentication failed');
		}
		else {
			response.writeHead(302, { Location: authUrl });
			response.end();
		}
	});
});

app.get('/login/verify', function(request, response) {
	// Verify identity assertion
	// NOTE: Passing just the URL is also possible
	relyingParty.verifyAssertion(request, function(error, result) {
		response.writeHead(200);
		response.end(!error && result.authenticated 
			? 'Success :)' // TODO: redirect to something interesting!
			: 'Failure :('); // TODO: show some error message!
	});
});
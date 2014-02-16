var WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({port: 3000});

wss.on('connection', function(ws) {
    ws.send('XYZ');
    ws.on('message', function(message) {
        console.log('received: %s', message);
    });
});
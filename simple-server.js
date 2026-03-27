const http = require('http');

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><body><h1>Simple Server Running</h1></body></html>');
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});

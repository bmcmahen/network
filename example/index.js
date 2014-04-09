var connect = require('connect');
var path = require('path');
connect.createServer(
   connect.static(path.join(__dirname, '..'))
).listen(4000);
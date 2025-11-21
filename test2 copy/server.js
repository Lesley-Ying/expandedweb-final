// Expanded Web
// NYUSH F25 - gohai

let express = require('express');
let app = express();
let port = 3000;

// this line of code makes express serve static files put
// in the "public" subdirectory
// e.g. putting an index.html there will get served to the
// client when they visit
app.use(express.static('public'));

// we can still have URLs that the server is handling
// "dynamically"
// e.g. requests for /test will execute the code below
app.get('/test', function(req, res) {
  res.send('Hello World!');
});

app.listen(port, '0.0.0.0', function() {
  console.log('Example app listening on port ' + port);
});


const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const fs = require('fs')

const client = __dirname + "/../client/"

router.get('/', function (req, res) {
  res.sendFile(path.join(client + '/index.html'));
});

//add the router
app.use('/', router);
app.use(express.static(client));
app.listen(process.env.port || 3000);

fs.readFile("m8n3.txt", function (err, buf) {
  var puzzle = buf.toString().split(/\r?\n/);
  var z='';
  var Fen;
  for (var i = 9; i < puzzle.length; i = i + 5) {
    z += puzzle[i] + "\n";
    Fen = z.split('\n')
  }
  prettyJson = { 'posfen': Fen, }
  let data = JSON.stringify(prettyJson);
  fs.writeFileSync('../client/fenpos.json', data);
});

console.log('Running at Port 3000')
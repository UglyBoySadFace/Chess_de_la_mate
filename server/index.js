const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const fs = require('fs')
const Chess = require('./node_modules/chess.js').Chess;
const chess= new Chess()
const client = __dirname + "/../client/"
const stockfish = require('./node_modules/.bin/stockfish')

//set up routes
router.get('/', function (req, res) {
  res.sendFile(path.join(client + '/index.html'));
});
app.use('/', router);
app.use(express.static(client));
app.listen(process.env.port || 3000);

//vytvori fenpos.json s moznymi pozicemi, ktere jsou validni
//mozna jde jednoduseji ?
//pri pridani jine database je treba toto upravit
fs.readFile("m8n3.txt", function (err, buf) {
  var puzzle = buf.toString().split(/\r?\n/);
  var z='';
  var Fen;
  for (var i = 9; i < puzzle.length; i = i + 5) {
    z += puzzle[i] + "\n";
    Fen = z.split('\n');
  }
  for (var i = 0; i< Fen.length;i++){
    if(!chess.load(Fen[i])){
      console.log('out: ',Fen[i])
      Fen.splice(i,1);
    }
  }
  prettyJson = { 'posfen': Fen, }
  let data = JSON.stringify(prettyJson);
  fs.writeFileSync('../client/fenpos.json', data);
});


console.log('Running at Port 3000')
const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const fs = require('fs')
const Chess = require('./node_modules/chess.js').Chess;
const chess = new Chess();
const client = __dirname + "/../client/";
var stockfish = require('./node_modules/stockfish/src/stockfish');
var engine = stockfish();
var bestmove;
var game_end = false;


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
  var z = '';
  var Fen;
  // i = starting line, i = i + k{spaces between lines}
  for (var i = 9; i < puzzle.length; i = i + 5) {
    z += puzzle[i] + "\n";
    Fen = z.split('\n');
  }
  delete z;
  z = []
  for (i = 0; i < Fen.length; i++) {
    if (chess.load(Fen[i])) {
      z.push(Fen[i])
    }
  }

  getBestMove(0);
  var counter = 1;
  var curmoves = 1;
  function getBestMove(index) {
    send('ucinewgame')
    console.log('game number:'+ index)
    curmoves = 1
    chess.load(z[index]);
    check_forBestMove(chess.fen());
  }
  function collectMoves() {
    if (!(chess.move(bestmove, { sloppy: true }) == null) && (curmoves < 7)) {
      console.log('move number:' + curmoves + ' has been made');
      curmoves+=1;
    } else if (counter < z.length-1){
      console.log('move is null or over m8in3');
      counter ++;
      getBestMove(counter);
    }
  }

  function send(str) {
    console.log("Sending: " + str)
    engine.postMessage(str);
  }

  function check_forBestMove(position_of_puzzle) {
    send('uci');
    engine.onmessage = function (line) {
      var match;
      console.log("Line: " + line)

      if (typeof line !== "string") {
        console.log("Got line:");
        console.log(typeof line);
        console.log(line);
        return;
      }

      if (line === "uciok") {
        send("position fen " + position_of_puzzle);
        send("eval");
        send("d");
        console.log(chess.ascii());
        //for mate in 5 we will need to search somewhere betweeen 10-11 plies
        send('go depth 11');

      }
      if (line.indexOf("bestmove") > -1) {
        match = line.match(/bestmove\s+(\S+)/);
        if (match) {
          bestmove = (match[1]);
          console.log('this is the best move: ' + bestmove);
          if (!chess.in_checkmate()) {
            collectMoves();
            check_forBestMove(chess.fen());
          } else if (counter < z.length - 1) {
            counter++;
            console.log('END OF THE GAME');
            getBestMove(counter);
          }
        }
      }
    };
  }
  prettyJson = { 'posfen': z, }
  let data = JSON.stringify(prettyJson);
  fs.writeFileSync('../client/fenpos.json', data);
}
);

console.log('Running at Port 3000');
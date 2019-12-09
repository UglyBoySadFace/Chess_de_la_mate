const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const fs = require('fs')
const Chess = require('./node_modules/chess.js/chess').Chess;
const chess = new Chess();
const client = __dirname + "/../client/";
var stockfish = require('./node_modules/stockfish/src/stockfish');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
var engine = stockfish();
var bestmove;

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
  z = [];
  for (i = 0; i < Fen.length; i++) {
    if (chess.load(Fen[i])) {
      z.push(Fen[i])
    }
  }

  var solutions = [];
  var bestMovesOfGame = [];
  var counter = 1;
  var curmoves = 1;
  getBestMovesOfGame(0);


  function getBestMovesOfGame(index) {
    if (index != z.length) {
      if (curmoves == 6) {
        solutions.push(bestMovesOfGame);
      }
      bestMovesOfGame = [];
      curmoves = 1;
      send('ucinewgame');
      console.log('game number:' + index);
      chess.load(z[index]);
      check_forBestMove(chess.fen());
    } else {
      prettyJson = { 'posfen': z, 'solutions': solutions }
      let data = JSON.stringify(prettyJson, null, 1);
      fs.writeFileSync('../client/fenpos.json', data);
      console.log(solutions.toString());
    }
  }
  function moveAndCollect() {
    if (!(chess.move(bestmove, { sloppy: true }) == null) && (curmoves < 6)) {
      console.log('move number:' + curmoves + ' has been made ==>' + bestmove);
      bestMovesOfGame.push(bestmove);
      curmoves += 1;
    } else {
      console.error('INVALID MOVE OR NOT M8IN3; SHUTTING DOWN')
      process.exit;
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
            moveAndCollect();
            check_forBestMove(chess.fen());
          } else {
            console.log('END OF THE GAME');
            getBestMovesOfGame(counter);
            counter++;
          }
        }
      }
    };
  }

}
);

console.log('Running at Port 3000');
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { maps } from './maps.js';
import { tileSize, team } from './public/js/constants.js';
import { nextTeamGenerator } from './utility.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));

let players = {};
let bullets = [];
const mapData = maps[0];
let points = { red: 0, blue: 0 };

const playerTeam = nextTeamGenerator(team);

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
  res.render('pages/home');
});
app.get('/game', (req, res) => {
  res.render('pages/index');
});
app.use(express.static(__dirname + '/public'));

// Socket.io
io.on('connection', (socket) => {
  console.log('New client has connected with id:', socket.id);

  const newPlayerTeam = playerTeam.next().value;

  // Initialize player game
  socket.emit('newGameData', { team: newPlayerTeam, map: mapData });

  // Add new player
  socket.on('newPlayer', (PlayerData) => {
    players[socket.id] = {
      ...PlayerData,
      team: newPlayerTeam,
    };
    io.emit('updatePlayers', players);
  });

  // Disconnect player
  socket.on('disconnect', () => {
    console.log(`Client ${socket.id} has disconnected`);
    delete players[socket.id];
    io.emit('updatePlayers', players);
  });

  // Move player
  socket.on('movePlayer', (positionData) => {
    const player = players[socket.id];
    if (player == undefined) return;
    player.x = positionData.x;
    player.y = positionData.y;
    player.facingAngle = positionData.facingAngle;
    player.movingX = positionData.movingX;
    player.movingY = positionData.movingY;
    player.movingAngle = positionData.movingAngle;
    socket.broadcast.emit('updatePlayers', players);
  });

  // Shoot bullet
  socket.on('shootBullet', () => {
    if (players[socket.id] == undefined) return;
    const player = players[socket.id];
    const newBullet = {
      playerId: socket.id,
      x: player.x + (player.gunWidth - 10) * Math.cos(player.facingAngle),
      y: player.y + (player.gunWidth - 10) * Math.sin(player.facingAngle),
      radius: 10,
      facingAngle: player.facingAngle,
      speed: 15,
      speedX: Math.cos(player.facingAngle) * 15,
      speedY: Math.sin(player.facingAngle) * 15,
      color: player.team,
    };
    console.log(newBullet);
    bullets.push(newBullet);
  });

  socket.on('pickupFlag', (flagData) => {
    if (players[socket.id] == undefined) return;
    players[socket.id].flag = flagData.item;
    io.emit('updateFlag', { ...flagData, points });
    socket.broadcast.emit('updatePlayers', players);
    socket.broadcast.emit('pickupFlag', flagData);
  });

  socket.on('dropFlag', (flagData) => {
    if (players[socket.id] == undefined) return;
    players[socket.id].flag = null;
    console.log(players[socket.id]);
    if (players[socket.id].team === team.RED) {
      points.red += 1;
      if (points.red >= 2) {
        io.emit('gameOver', 'Red');
        reset();
      }
    } else if (players[socket.id].team === team.BLUE) {
      points.blue += 1;
      if (points.blue >= 2) {
        io.emit('gameOver', 'Blue');
        reset();
      }
    }
    io.emit('updateFlag', { ...flagData, points });
    socket.broadcast.emit('updatePlayers', players);
    socket.broadcast.emit('dropFlag', flagData);
  });

  // socket.on('createRoom', (room) => {
  //   const roomID = Math.floor(100000 + Math.random() * 900000).toString();
  //   socket.join(room);
  //   console.log(socket);
  //   parties.push({ id: roomID, players: [socket.id] });
  // });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

setInterval(() => {
  for (const id in players) {
    if (players[id]) {
      if (players[id].hp < 100) {
        players[id].hp += 1;
        io.emit('updatePlayers', players);
      }
    }
  }
}, 1000);

// Update bullets
function UpdateBullets() {
  bullets.forEach((bullet, i) => {
    bullet.x += bullet.speedX;
    bullet.y += bullet.speedY;

    for (const id in players) {
      if (bullet.playerId != id) {
        var dx = players[id].x - bullet.x;
        var dy = players[id].y - bullet.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < players[id].radius) {
          io.emit('playerHit', id);
          players[id].hp -= bullet.damage;
          io.emit('updatePlayers', players);
          if (players[id].hp <= 0) {
            io.emit('playerDead', id);
            players[id].hp = 100;
            io.emit('updatePlayers', players);
          }
          bullets.splice(i, 1);
        }
      }
    }

    mapData.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block === 1) {
          const blockX = x * tileSize;
          const blockY = y * tileSize;
          if (
            bullet.x + bullet.radius >= blockX &&
            bullet.x - bullet.radius <= blockX + tileSize &&
            bullet.y + bullet.radius >= blockY &&
            bullet.y - bullet.radius <= blockY + tileSize
          ) {
            bullets.splice(i, 1);
          }
        }
      });
    });
  });

  io.emit('updateBullets', bullets);
}

function reset() {
  points = { red: 0, blue: 0 };
  bullets = [];
  nextTeam = team.RED;
}

setInterval(UpdateBullets, 16);

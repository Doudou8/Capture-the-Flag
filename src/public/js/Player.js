import { tileSize, direction, team } from './constants.js';
import { round } from './utils.js';
import { texture } from './textures.js';
import { updateHpBar } from './gui.js';

export class Player {
  constructor(name, team, radius, facingAngle, speed, map, client) {
    this.name = name;
    this.team = team;
    this.map = map;
    this.x = map.getSpawnPoint(team).x + tileSize / 2;
    this.y = map.getSpawnPoint(team).y + tileSize / 2;
    this.radius = radius;
    this.facingAngle = facingAngle;
    this.speed = speed;
    this.gunWidth = 55;
    this.gunHeight = 25;
    this.flag = null;
    this.client = client;
    this.alpha = 1;
    this.hp = 100;
    this.movingX = false;
    this.movingY = false;
    this.movingAngle;
  }

  draw(ctx, socket) {
    // Check if player touches item
    if (this.map.items.length > 0) {
      this.map.items.forEach((item, i) => {
        if (
          this.x + this.radius >= item.x &&
          this.x - this.radius <= item.x + item.width &&
          this.y + this.radius >= item.y &&
          this.y - this.radius <= item.y + item.height
        ) {
          const grabItemSound = new Audio('/sounds/grab-item.wav');

          switch (item.type) {
            case 'flag':
              if (item.team != this.team && this.client) {
                if (!item.hidden) grabItemSound.play();
                item.hidden = true;
                this.flag = item;
                socket.emit('pickupFlag', {
                  item,
                  index: i,
                  playerId: socket.id,
                });
              }
              break;

            case 'chest':
              if (item.team === this.team && this.flag != null && this.client) {
                const openChestSound = new Audio('/sounds/chest-open.wav');
                openChestSound.play();
                item.texture = texture.openChest;
                this.flag.hidden = false;
                this.flag = null;
                socket.emit('dropFlag', {
                  index: i,
                  playerId: socket.id,
                });
                setTimeout(() => {
                  const closeChestSound = new Audio('/sounds/chest-close.wav');
                  closeChestSound.play();
                  item.texture = texture.closeChest;
                }, 2000);
              }
              break;

            case 'speed-boost':
              if (!item.hidden) grabItemSound.play();
              item.hidden = true;
              this.speed += 0.3;
              setTimeout(() => {
                this.speed -= 0.3;
              }, 7000);
              break;

            default:
              break;
          }
        }
      });
    }

    // Gun
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#979797';
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle);
    ctx.fillRect(0, -this.gunHeight / 2, this.gunWidth, this.gunHeight);
    ctx.restore();

    // Circle
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.team;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // Flag
    if (this.flag != null) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.facingAngle - Math.PI / 2);
      ctx.drawImage(
        this.flag.texture,
        -this.radius,
        -this.radius * 2,
        tileSize,
        tileSize,
      );
      ctx.restore();
    }

    // HP
    ctx.save();
    if (this.hp <= 100 && this.hp > 50) {
      ctx.fillStyle = '#6BCB77';
    } else if (this.hp <= 50 && this.hp > 20) {
      ctx.fillStyle = '#FFD93D';
    } else {
      ctx.fillStyle = '#FF6B6B';
    }
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.2;
    ctx.font = '35px Bebas Neue';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(this.hp, this.x, this.y + 2);
    ctx.strokeText(this.hp, this.x, this.y + 2);
    ctx.restore();
  }

  move(controller) {
    if (Object.values(controller).includes(true)) {
      this.movingX = true;
      this.movingY = true;
      let moveX = 0;
      let moveY = 0;

      if (controller.w) moveY--;
      if (controller.s) moveY++;
      if (controller.d) moveX++;
      if (controller.a) moveX--;

      this.movingAngle = Math.atan2(moveY, moveX);

      let speedX =
        moveX != 0 ? round(this.speed * Math.cos(this.movingAngle), 2) : 0;
      let speedY =
        moveY != 0 ? round(this.speed * Math.sin(this.movingAngle), 2) : 0;

      if (this.didCollideX(1, speedX)) speedX = 0;
      if (this.didCollideY(1, speedY)) speedY = 0;

      if (speedX === 0) {
        this.movingX = false;
      }
      if (speedY === 0) {
        this.movingY = false;
      }

      this.x += speedX;
      this.y += speedY;
    } else {
      this.movingX = false;
      this.movingY = false;
    }
  }

  didCollideX(blockNumber, speed) {
    const bumper1 = this.map.getTileAt(
      speed < 0 ? this.x - this.radius + speed : this.x + this.radius + speed,
      this.y - this.radius + 1,
    );
    const bumper2 = this.map.getTileAt(
      speed < 0 ? this.x - this.radius + speed : this.x + this.radius + speed,
      this.y + this.radius - 1,
    );
    return bumper1 === 1 || bumper2 === 1;
  }

  didCollideY(blockNumber, speed) {
    const bumper1 = this.map.getTileAt(
      this.x - this.radius + 1,
      speed < 0 ? this.y - this.radius + speed : this.y + this.radius + speed,
    );
    const bumper2 = this.map.getTileAt(
      this.x + this.radius - 1,
      speed < 0 ? this.y - this.radius + speed : this.y + this.radius + speed,
    );
    return bumper1 === 1 || bumper2 === 1;
  }

  hit() {
    if (this.client) {
      updateHpBar(this.hp);
    }
  }

  respawn() {
    this.x = this.map.getSpawnPoint(this.team).x + tileSize / 2;
    this.y = this.map.getSpawnPoint(this.team).y + tileSize / 2;
    this.flag.hidden = false;
    this.flag = null;
    this.hp = 100;
    if (this.client) {
      updateHpBar(100);
    }
  }
}

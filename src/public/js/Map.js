import { Item } from './Item.js';
import { tileSize, team, direction } from './constants.js';
import { texture } from './textures.js';

export class Map {
  constructor(mapData) {
    this.mapData = mapData;
    this.width = this.mapData[0].length * tileSize;
    this.height = this.mapData.length * tileSize;
    this.items = [];
    this.redSpawnpoints = [];
    this.blueSpawnpoints = [];

    this.mapData.forEach((row, y) => {
      row.forEach((block, x) => {
        switch (block) {
          case 3:
            this.blueSpawnpoints.push({ x: x * tileSize, y: y * tileSize });
            break;

          case 4:
            this.redSpawnpoints.push({ x: x * tileSize, y: y * tileSize });
            break;

          case 5:
            this.items.push(
              new Item(
                'flag',
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
                texture.redFlag,
                team.RED,
              ),
            );
            break;

          case 6:
            this.items.push(
              new Item(
                'flag',
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
                texture.blueFlag,
                team.BLUE,
              ),
            );
            break;

          case 7:
            this.items.push(
              new Item(
                'chest',
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
                texture.closeChest,
                team.BLUE,
              ),
            );
            break;

          case 8:
            this.items.push(
              new Item(
                'chest',
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
                texture.closeChest,
                team.RED,
              ),
            );
            break;

          case 9:
            this.items.push(
              new Item(
                'speed-boost',
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
                texture.bolt,
              ),
            );
            break;

          default:
            break;
        }
      });
    });
  }

  draw(ctx, camera) {
    ctx.save();

    this.mapData.forEach((row, y) => {
      row.forEach((block, x) => {
        if (
          camera.isInViewRect(x * tileSize, y * tileSize, tileSize, tileSize)
        ) {
          switch (block) {
            case 0:
            case 9:
              ctx.fillStyle = ctx.createPattern(texture.woodFloor, 'repeat');
              break;

            case 1:
              ctx.fillStyle = ctx.createPattern(texture.steelWall, 'repeat');
              break;

            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
              ctx.fillStyle = ctx.createPattern(texture.steelFloor, 'repeat');
              break;

            default:
              break;
          }

          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

          // Development block outline
          // ctx.strokeStyle = 'yellow';
          // ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);

          // Development block numbers
          // ctx.fillStyle = 'white';
          // ctx.font = '12px Arial';
          // ctx.fillText(`${x},${y}`, x * tileSize + 4, y * tileSize + 12);
        }
      });
    });

    this.items.forEach((item) => {
      if (camera.isInViewRect(item.x, item.y, item.width, item.height)) {
        item.draw(ctx);
      }
    });

    ctx.restore();
  }

  getSpawnPoint(playerTeam) {
    if (playerTeam === team.BLUE) {
      return this.blueSpawnpoints[
        Math.floor(Math.random() * this.blueSpawnpoints.length)
      ];
    } else if (playerTeam === team.RED) {
      return this.redSpawnpoints[
        Math.floor(Math.random() * this.redSpawnpoints.length)
      ];
    }
  }

  getTileAt(x, y) {
    return this.mapData[Math.floor(y / tileSize)][Math.floor(x / tileSize)];
  }
}

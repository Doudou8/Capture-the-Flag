import { clamp, randomSign } from './utils.js';

const canvas = document.querySelector('canvas');

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.shaking = false;
  }

  follow(player, map) {
    this.x = Math.round(
      clamp(
        player.x - canvas.width / 2,
        0,
        canvas.width > map.width
          ? (map.width - canvas.width) / 2
          : map.width - canvas.width,
      ) + (this.shaking ? Math.random() * 5 * randomSign() : 0),
    );
    this.y = Math.round(
      clamp(
        player.y - canvas.height / 2,
        0,
        canvas.height > map.height
          ? (map.height - canvas.height) / 2
          : map.height - canvas.height,
      ) + (this.shaking ? Math.random() * 5 * randomSign() : 0),
    );
  }

  isInViewRect(x, y, width, height) {
    return (
      x + width > this.x &&
      x < this.x + canvas.width &&
      y + height > this.y &&
      y < this.y + canvas.height
    );
  }

  isInViewCircle(x, y, radius) {
    return (
      x + radius > this.x &&
      x - radius < this.x + canvas.width &&
      y + radius > this.y &&
      y - radius < this.y + canvas.height
    );
  }

  shake() {
    this.shaking = true;
    setTimeout(() => {
      this.shaking = false;
    }, 150);
  }
}

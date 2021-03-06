export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function round(value, precision) {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

export function randomSign() {
  return Math.random() < 0.5 ? -1 : 1;
}

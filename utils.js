function createSeed() {
  const bytes = new Uint32Array(2);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, function(value) { return value.toString(36); }).join("-");
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let value = hashSeed(seed) || 1;
  return function random() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(items, seed) {
  const copy = items.slice();
  const random = createRng(seed);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function seededSample(items, count, seed) {
  const shuffled = seededShuffle(items, seed);
  return shuffled.slice(0, count);
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(function(part) { return part[0]; })
    .join("")
    .toUpperCase();
}

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: error };
  }
}

function getLocalPhotoPath(character, modeId) {
  return "./assets/photos/" + modeId + "/" + character.id;
}
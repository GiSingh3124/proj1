import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (file) => readFile(path.join(root, file), 'utf8');

const [html, driving, audio, sessions, environment, rendering] = await Promise.all([
  read('index.html'),
  read('src/driving.js'),
  read('src/audio.js'),
  read('src/sessions.js'),
  read('src/environment.js'),
  read('src/rendering.js'),
]);

assert.match(html, /data-key="throttle"/, 'manual throttle control is missing');
assert.match(driving, /const throttle = this\.inputs\.throttle/, 'driving loop does not read throttle');
assert.match(driving, /let acceleration = throttle \? 24 : -7\.5/, 'car must decelerate without throttle');
assert.match(driving, /const maxSpeed = boosting \? 97 : 92/, 'speed caps changed unexpectedly');
assert.match(audio, /this\.enabled = false/, 'audio must start disabled');
assert.match(sessions, /\? 22 : session === 'Q2' \? 16 : 10/, 'qualifying fields must be 22, 16 and 10');
assert.doesNotMatch(environment, /createTrees|placeRamps|placePickups/, 'track contains old obstacle-generation code');
assert.match(environment, /createBarriers\(\)/, 'track barriers are missing');
assert.match(rendering, /createF1Car/, 'procedural F1 car renderer is missing');

console.log('Static smoke checks passed.');

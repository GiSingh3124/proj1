import { trackMethods } from './track.js';
import { sceneMethods } from './scene.js';

export const worldMethods = Object.assign({}, sceneMethods, trackMethods);

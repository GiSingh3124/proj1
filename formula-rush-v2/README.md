# Formula Rush 3D V2

Mobile-first WebGL arcade racer focused on controllability and reliability.

## Architecture

- `src/game.js`: lightweight engine facade and composition root.
- `src/graphics.js`: procedural F1-style car model, track ribbons and textures.
- `src/world.js`: circuit construction, barriers, grandstands, camera and scene lifecycle.
- `src/session.js`: Q1/Q2/Q3, race grids, championship and session transitions.
- `src/race.js`: manual throttle physics, steering, AI, collisions, timing and HUD state.
- `src/audio.js`: opt-in low-volume procedural audio; muted by default.
- `src/config.js`: teams, drivers and three circuit definitions.

## Acceptance checks completed

- the car remains stopped until `ACCELERA` is held;
- releasing the throttle slows the car to zero;
- audio is disabled by default;
- no trees, ramps or pickups are created on the circuit;
- road, kerbs, run-off and barriers use the same spline normals;
- Q1/Q2/Q3 fields are 22/16/10 cars;
- module graph and JavaScript syntax validated locally;
- top speed is capped around 331 km/h, or 349 km/h with ERS.

The car geometry is original and inspired by modern open-wheel racing cars. No official logos or proprietary game assets are included.

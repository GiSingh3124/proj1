# Formula Rush 3D V3

Mobile-first WebGL racing game with a modular codebase.

## Modules

- `game.js`: lifecycle and orchestration
- `environment.js`: circuit, barriers, grandstands and camera
- `rendering.js`: detailed procedural open-wheel car and road geometry
- `driving.js`: manual throttle, steering, braking, ERS and collisions
- `sessions.js`: Q1/Q2/Q3, race grids and championship scoring
- `audio.js`: optional low-volume procedural audio, disabled by default
- `config.js`: teams, drivers and circuits

## Verified behaviour

- the car remains stationary until ACCELERA is held;
- audio is disabled by default;
- trees, ramps and pickups are not placed on the racing surface;
- qualifying fields are 22 / 16 / 10;
- top speed is capped at 331 km/h, or 349 km/h with ERS.

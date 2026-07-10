# Formula Rush 3D V3 — Test report

Executed before publishing the production bundle:

```text
npm run check
> node --check app.js && node --check src/physics.js
PASS

npm test
> node tests/physics.test.mjs && node tests/static.test.mjs
physics and 5-minute stability tests: PASS
production static checks: PASS
```

Covered cases:

- the car remains at exactly zero speed without throttle for 30 simulated seconds;
- throttle, coasting and braking have distinct behaviour;
- ERS only activates while accelerating and remains within 0–100%;
- steering works in both directions and lateral position stays bounded;
- curve force pushes the car outward and counter-steering reduces the drift;
- a five-minute, 18,000-step simulation produces no NaN, runaway speed or invalid state;
- the production bundle contains manual throttle and off-track handling;
- ramps, pickups and track-tree generators are absent from the production bundle.

Production bundle SHA-256:

```text
8345afaeb05bb96074d754fca8544346fa0a65c50c0ea2509faee728ab3c140a
```

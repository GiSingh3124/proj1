export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;

export function stepVehicle(state, input, dt, options = {}) {
  const performance = options.performance ?? 1;
  const roadWidth = options.roadWidth ?? 15;
  const maxBase = 90 * performance;
  const maxNitro = 97 * performance;
  const offroad = Math.abs(state.lateral) > roadWidth * 0.47;
  const nitroActive = Boolean(input.nitro && input.gas && state.nitro > 0 && !input.brake && state.speed > 25);

  let acceleration = input.gas ? 38 : -10;
  if (input.brake) acceleration = -88;
  if (nitroActive) {
    acceleration += 39;
    state.nitro = Math.max(0, state.nitro - 24 * dt);
  } else {
    state.nitro = Math.min(100, state.nitro + 3.5 * dt);
  }
  if (offroad) acceleration -= 48;

  const topSpeed = nitroActive ? maxNitro : maxBase;
  state.speed = clamp(state.speed + acceleration * dt, 0, topSpeed);
  state.speed *= offroad ? Math.pow(0.91, dt * 10) : Math.pow(0.996, dt * 60);
  if (!input.gas && state.speed < 0.7) state.speed = 0;

  const steering = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  const speedRatio = clamp(state.speed / maxBase, 0, 1);
  const steerStrength = lerp(10.5, 6.2, speedRatio);
  state.lateralVelocity += steering * steerStrength * dt;
  state.lateralVelocity *= Math.pow(0.09, dt);
  state.lateral += state.lateralVelocity * dt * 7.5;
  state.lateral = clamp(state.lateral, -roadWidth * 0.66, roadWidth * 0.66);

  return { nitroActive, offroad, steering, maxBase, maxNitro };
}

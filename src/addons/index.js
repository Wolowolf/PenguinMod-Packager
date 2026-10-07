import gamepad from './gamepad';
import pointerlock from './pointerlock';
import pause from './pause';

const run = (scaffolding, options) => {
  const api = {
    scaffolding,
    options
  };

  if (options.gamepad) gamepad(api);
  if (options.pointerlock) pointerlock(api);
  // PenguinMod Desktop (Section 30): no special / unsafe cloud behaviors (no cloud variables).
  if (options.pause) pause(api);
};

window.ScaffoldingAddons = {
  run
};

import cursorSrc from "./cursor.png";
import {waitForProject, createGamepad, connectGamepad} from "scratch-vm/src/web-shared/gamepad-controls.js";

export default async function (scaffolding, pointerlock) {
  const vm = scaffolding.vm;
  await waitForProject(vm);
  const gamepad = createGamepad(vm, console);
  const virtualCursorElement = connectGamepad({
    gamepad,
    vm,
    cursorSrc,
    pointerlock,
    getLayersRect: () => scaffolding.layersRect
  });
  if (!pointerlock) {
    scaffolding._overlays.appendChild(virtualCursorElement);
  }
}

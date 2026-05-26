import { Engine } from "./engine/Engine";

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, 800, 600);

// TODO: add your game scenes and objects here

engine.start();

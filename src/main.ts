import { Engine } from "./engine/Engine";
import * as playerDemo    from "./examples/player-demo";
import * as bouncingBall  from "./examples/bouncing-ball";

const EXAMPLES = [playerDemo, bouncingBall];

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, 800, 600);

// --- gallery ---

let launched = false;

const gallery = {
  render(ctx: CanvasRenderingContext2D) {
    // background
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, engine.width, engine.height);

    // title
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("examples", engine.width / 2, 80);

    // list
    ctx.font = "18px monospace";
    EXAMPLES.forEach((ex, i) => {
      ctx.fillStyle = "#888";
      ctx.textAlign = "right";
      ctx.fillText(`[${i + 1}]`, engine.width / 2 - 12, 140 + i * 44);

      ctx.fillStyle = "#eee";
      ctx.textAlign = "left";
      ctx.fillText(ex.title, engine.width / 2, 140 + i * 44);
    });

    ctx.textAlign = "left";
  },

  update(_dt: number) {
    if (launched) return;
    EXAMPLES.forEach((ex, i) => {
      if (engine.input.isPressed(`Digit${i + 1}`)) launch(ex);
    });
  },
};

function launch(ex: typeof EXAMPLES[number]) {
  launched = true;
  engine.removeUI(gallery);

  ex.run(engine);

  // Escape goes back to gallery
  engine.addUI({
    update(_dt) {
      if (engine.input.isPressed("Escape")) window.location.reload();
    },
    render(ctx) {
      ctx.fillStyle = "#555";
      ctx.font = "13px monospace";
      ctx.fillText("Esc — back", 12, engine.height - 12);
    },
  });
}

engine.addUI(gallery);
engine.start();

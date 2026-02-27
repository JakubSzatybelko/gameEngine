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

    // list — measure each row so the [N] + title pair is truly centered
    ctx.font = "18px monospace";
    EXAMPLES.forEach((ex, i) => {
      const y = 140 + i * 44;
      const num = `[${i + 1}]  `;
      const numW = ctx.measureText(num).width;
      const totalW = numW + ctx.measureText(ex.title).width;
      const startX = Math.round(engine.width / 2 - totalW / 2);

      ctx.textAlign = "left";
      ctx.fillStyle = "#888";
      ctx.fillText(num, startX, y);

      ctx.fillStyle = "#eee";
      ctx.fillText(ex.title, startX + numW, y);
    });
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

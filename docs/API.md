# Game Engine API

A minimal 2D canvas game engine built with TypeScript + Vite.

---

## Table of Contents

- [Engine](#engine)
- [GameObject](#gameobject)
- [Scene / SceneManager](#scene--scenemanager)
- [Input](#input)
- [Camera](#camera)
- [Physics](#physics)
- [Sprite](#sprite)
- [Animator](#animator)
- [AssetLoader](#assetloader)
- [AudioManager](#audiomanager)
- [UIElement](#uielement)

---

## Engine

The core class. Owns the canvas, the game loop, and all subsystems.

```ts
import { Engine } from "./engine/Engine";

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, 800, 600);
engine.start();
```

### Constructor

```ts
new Engine(canvas: HTMLCanvasElement, width: number, height: number)
```

### Properties

| Property | Type | Description |
|---|---|---|
| `canvas` | `HTMLCanvasElement` | The canvas element |
| `ctx` | `CanvasRenderingContext2D` | The 2D rendering context |
| `width` | `number` | Canvas width in px |
| `height` | `number` | Canvas height in px |
| `input` | `Input` | Keyboard input system |
| `scenes` | `SceneManager` | Scene management |
| `camera` | `Camera` | World-space camera |
| `assets` | `AssetLoader` | Image asset loader |
| `audio` | `AudioManager` | Audio playback |
| `physics` | `PhysicsWorld` | Physics simulation |

### Methods

```ts
engine.start()                    // begin the game loop
engine.add(obj: GameObject)       // register a game object
engine.remove(obj: GameObject)    // unregister a game object
engine.clearObjects()             // remove all objects + UI
engine.addUI(el: UIElement)       // add a HUD/overlay element
engine.removeUI(el: UIElement)    // remove a HUD/overlay element
```

### Loop order (per frame)

1. `physics.step(dt)`
2. `camera.update(dt)`
3. `obj.update(dt)` for all objects
4. Collision detection → `onCollide` callbacks
5. Clear canvas
6. Apply camera transform → `obj.render(ctx)` for all objects (sorted by `zIndex`)
7. `ui.update(dt)` + `ui.render(ctx)` (screen-space, no camera)
8. `input.flush()`

---

## GameObject

Interface that all game objects must implement.

```ts
import type { GameObject, Bounds } from "./engine/Engine";
```

```ts
interface GameObject {
  zIndex?: number;          // render order, lower = drawn first (default 0)
  collidable?: boolean;     // opt-in to collision detection
  bounds?: Bounds;          // AABB used for collisions and click hit-testing
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  onClick?(): void;         // called when user clicks within bounds
  onCollide?(other: GameObject): void;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### Example

```ts
class Ball implements GameObject {
  x = 100; y = 100;
  collidable = true;

  get bounds(): Bounds {
    return { x: this.x - 16, y: this.y - 16, width: 32, height: 32 };
  }

  update(dt: number) { /* ... */ }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

engine.add(new Ball());
```

---

## Scene / SceneManager

Scenes group objects and logic. Loading a new scene tears down the previous one.

```ts
import { Scene } from "./engine/Scene";
```

```ts
abstract class Scene {
  onEnter(engine: Engine): void  // called when scene is loaded
  onExit(engine: Engine): void   // called before scene is replaced
}
```

```ts
engine.scenes.load(scene: Scene)   // load a new scene (calls onExit → clearObjects → onEnter)
engine.scenes.active               // currently active Scene | null
```

### Example

```ts
class GameScene extends Scene {
  onEnter(eng: Engine) {
    eng.add(new Player());
  }

  onExit(_eng: Engine) {
    // cleanup if needed
  }
}

engine.scenes.load(new GameScene());
```

---

## Input

Keyboard input — key codes follow the [KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) standard (`"ArrowLeft"`, `"Space"`, `"KeyA"`, etc.).

```ts
engine.input.isDown(code: string)      // true every frame the key is held
engine.input.isPressed(code: string)   // true only on the first frame the key is pressed
engine.input.isReleased(code: string)  // true only on the frame the key is released
```

### Example

```ts
update(dt: number) {
  if (engine.input.isDown("ArrowRight")) this.x += 200 * dt;
  if (engine.input.isPressed("Space"))   this.jump();
}
```

---

## Camera

World-space camera with optional smooth following and zoom.

```ts
engine.camera.x         // world X the camera is centered on
engine.camera.y         // world Y the camera is centered on
engine.camera.zoom      // scale factor (default 1)
engine.camera.lerp      // follow smoothing: 1 = instant, 0.08 = smooth
```

```ts
engine.camera.follow(fn: () => { x: number; y: number })  // set a follow target
engine.camera.unfollow()                                   // stop following
```

### Example

```ts
// follow the player, centered on their midpoint
engine.camera.lerp = 0.1;
engine.camera.follow(() => ({ x: player.x + 16, y: player.y + 16 }));
```

---

## Physics

Opt-in rigid body physics. `engine.physics.step(dt)` runs automatically before `update()`.

```ts
import { PhysicsBody, PhysicsWorld } from "./engine/Physics";
```

### PhysicsBody

```ts
const body = engine.physics.add(new PhysicsBody());
```

| Property | Default | Description |
|---|---|---|
| `x`, `y` | `0` | World position |
| `vx`, `vy` | `0` | Velocity (px/s) |
| `mass` | `1` | Mass in game units |
| `gravityScale` | `1` | `0` = weightless, `1` = normal, `-1` = floats |
| `drag` | `0` | Velocity damping per second (`0.3` = mild air resistance) |
| `restitution` | `0` | Bounciness hint (`0`–`1`) for collision response |

| Method | Description |
|---|---|
| `applyForce(fx, fy)` | Sustained force this frame (F=ma). Call every frame to maintain. |
| `applyImpulse(ix, iy)` | Instant velocity change — good for jumps, explosions. |
| `applyAcceleration(ax, ay)` | Direct velocity nudge, bypasses mass. |

### PhysicsWorld

```ts
engine.physics.gravity         // Vec2, default { x: 0, y: 980 }
engine.physics.add(body)       // register a body, returns body
engine.physics.remove(body)    // unregister a body
```

### Example

```ts
class Ball implements GameObject {
  body: PhysicsBody;

  constructor() {
    this.body = engine.physics.add(new PhysicsBody());
    this.body.x = 400;
    this.body.y = 50;
    this.body.restitution = 0.6;
  }

  update(dt: number) {
    // floor bounce
    if (this.body.y > 550) {
      this.body.y = 550;
      this.body.vy = -Math.abs(this.body.vy) * this.body.restitution;
    }
    // jump
    if (engine.input.isPressed("Space")) {
      this.body.applyImpulse(0, -500);
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(this.body.x, this.body.y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

---

## Sprite

Draws images or individual frames from a spritesheet.

```ts
import { Sprite } from "./engine/Sprite";

const sprite = new Sprite(engine.assets.get("sheet"), frameWidth, frameHeight);
```

```ts
// draw a specific spritesheet frame (0-indexed col/row)
sprite.draw(ctx, x, y, col, row, destW?, destH?)

// draw an arbitrary source rect
sprite.drawRect(ctx, { sx, sy, sw, sh }, x, y, destW?, destH?)
```

---

## Animator

Frame-based sprite animation controller. Works alongside `Sprite`.

```ts
import { Animator } from "./engine/Animator";

const animator = new Animator()
  .add("idle", { frames: [{ col: 0, row: 0 }, { col: 1, row: 0 }], fps: 4 })
  .add("run",  { frames: [{ col: 0, row: 1 }, { col: 1, row: 1 }], fps: 10, loop: true });
```

```ts
animator.play(name: string)    // switch animation (no-op if already playing)
animator.update(dt: number)    // advance frame timer — call in object's update()
animator.frame                 // { col, row } of the current frame
animator.name                  // name of the currently playing animation
animator.done                  // true when a non-looping animation has finished
```

### Example

```ts
update(dt: number) {
  const moving = engine.input.isDown("ArrowRight");
  this.animator.play(moving ? "run" : "idle");
  this.animator.update(dt);
}

render(ctx: CanvasRenderingContext2D) {
  const { col, row } = this.animator.frame;
  this.sprite.draw(ctx, this.x, this.y, col, row);
}
```

---

## AssetLoader

Preload images before the game starts.

```ts
await engine.assets
  .image("player", "/sprites/player.png")
  .image("tiles",  "/sprites/tiles.png")
  .loadAll();

const img = engine.assets.get("player"); // HTMLImageElement
```

---

## AudioManager

Sound effects, music, and procedural tones.

```ts
// load audio files
await engine.audio.load("jump", "/audio/jump.wav");
await engine.audio.loadAll({ jump: "/audio/jump.wav", bgm: "/audio/bgm.mp3" });

// one-shot SFX
engine.audio.play("jump", volume?)

// looping background music
engine.audio.playMusic("bgm", volume?)
engine.audio.stopMusic()
engine.audio.musicVolume = 0.3

// procedural tone (no file needed)
engine.audio.tone(freq, duration, volume?, type?)
// e.g. engine.audio.tone(440, 0.1, 0.2, "sine")

// master volume
engine.audio.masterVolume = 0.8

// call on first user input (browser requirement)
engine.audio.resume()
```

---

## UIElement

Interface for screen-space HUD elements (rendered after the camera transform, always on-screen).

```ts
import type { UIElement } from "./engine/UIElement";

interface UIElement {
  update?(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

engine.addUI(element)
engine.removeUI(element)
```

### Example

```ts
const hud: UIElement = {
  render(ctx) {
    ctx.fillStyle = "#fff";
    ctx.font = "16px monospace";
    ctx.fillText(`Score: ${score}`, 16, 32);
  }
};

engine.addUI(hud);
```

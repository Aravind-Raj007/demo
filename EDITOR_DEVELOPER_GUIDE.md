### Editor Developer Guide

This document describes the **AdCreator editor** in enough detail that you can **re-implement the same editor in another app or stack**.

It focuses on:

- The **data model** (templates, layers, animations)
- The **editor state machine**
- The **responsibilities and behavior** of each UI part
- The **playback** and **export** pipelines
- A **step-by-step integration checklist** for a new project

---

### 1. Core concepts

At a high level, the editor is a **timeline-based motion graphics editor**:

- An **ad** = a fixed **duration** + an ordered list of **layers**.
- Each **layer** describes one visual element (text or image) and:
  - When it is visible (start/end time)
  - Where it appears (x/y, size)
  - How it looks (style)
  - How it animates (animation preset)
- A global **playhead time** determines:
  - Which layers are visible
  - The animation progress for each layer

The editor UI is just different views and controls on top of this model.

---

### 2. Data model

#### 2.1 Template

```ts
type TemplateId = string;

interface Template {
  id: TemplateId;
  name: string;
  thumbnail?: string;        // optional illustrative thumbnail
  duration: number;          // total length of the ad in seconds
  layers: Layer[];
}
```

In this project, templates live in `src/data/templates.js`. In your app, you might store them in:

- JSON files
- A database (e.g., Postgres) with a `jsonb` column
- Any other configuration system

#### 2.2 Layer

```ts
type LayerId = string;

type LayerType = 'image' | 'text'; // can be extended with 'shape', 'video', etc.

interface Layer {
  id: LayerId;
  type: LayerType;
  name: string;          // label for UI

  // Timing (in seconds, relative to template timeline)
  start: number;
  end: number;

  // Content
  src?: string;          // for images
  content?: string;      // for text

  // Animation preset key
  animation: AnimationKey;

  // Visual style
  style: LayerStyle;
}

interface LayerStyle {
  // Position & size relative to canvas (0–100)
  x: number;             // percentage (0 left, 100 right)
  y: number;             // percentage (0 top, 100 bottom)
  width?: number;        // percent, optional (auto if omitted)
  height?: number;       // percent, optional

  // Layer stacking & visibility
  zIndex?: number;
  opacity?: number;      // 0–1, base opacity

  // Text-specific style
  fontSize?: number;     // in px
  color?: string;        // CSS color
  fontWeight?: string | number;
  fontFamily?: string;
  backgroundColor?: string;
  padding?: string;      // e.g. "10px 20px"
  borderRadius?: string; // e.g. "8px"
  textAlign?: 'left' | 'center' | 'right';

  // Other CSS-like values can be added as needed
}
```

#### 2.3 Animation presets

An animation is a **named preset** describing how a layer changes over a normalized progress \([0, 1]\).

```ts
type AnimationKey =
  | 'none'
  | 'fadeIn'
  | 'slideInLeft'
  | 'slideInRight'
  | 'slideInTop'
  | 'slideInBottom'
  | 'zoomIn'
  | 'zoomOut'
  | 'bounceIn'
  | 'rotateIn'
  | 'blurIn'
  | 'elasticPop'
  | 'slideInDiagonal'
  | 'flipInX'
  | 'flipInY'
  | 'swing'
  | 'heartbeat'
  | 'wobble';

interface AnimationVariant {
  name: string;                 // label for UI
  initial: AnimationStyle;      // style at progress = 0
  animate: AnimationStyle;      // style at progress = 1
  exit?: AnimationStyle;        // optional style for exit (not heavily used here)
}

interface AnimationStyle {
  opacity?: number;
  scale?: number;
  x?: number;                   // px translation
  y?: number;                   // px translation
  rotate?: number;              // degrees
  rotateX?: number;             // degrees (3D flip)
  rotateY?: number;             // degrees (3D flip)
  filter?: string;              // e.g. "blur(10px)"
}
```

In this project, animations are defined in `src/data/animations.js`.  
The editor interpolates between `initial` and `animate` based on a computed progress.

---

### 3. Editor state machine

Regardless of framework, you will want a single source of truth containing:

```ts
interface EditorState {
  activeTemplate: Template | null;
  layers: Layer[];              // working copy of activeTemplate.layers

  currentTime: number;          // seconds
  isPlaying: boolean;

  selectedLayerId: LayerId | null;

  zoom: number;                 // e.g. 0.2–2.0
  isExporting: boolean;
}
```

#### 3.1 Key transitions

- **Load template**
  - Inputs: `templateId` (optional)
  - Steps:
    - Resolve template from store.
    - Deep-clone `template.layers` into `state.layers`.
    - Set `state.activeTemplate = template`.
    - Reset `state.currentTime = 0`, `state.selectedLayerId = null`, `state.isPlaying = false`.

- **Select layer**
  - Inputs: `layerId`
  - `state.selectedLayerId = layerId`.

- **Update layer**
  - Inputs: `layerId`, `updates` (partial `Layer` or `LayerStyle`)
  - Find the layer by id in `state.layers` and merge updates immutably:
    - Basic fields: `name`, `content`, `start`, `end`, `animation`
    - Style updates: `style = { ...style, ...styleUpdates }`

- **Delete layer**
  - Inputs: `layerId`
  - Remove from `state.layers`.
  - If `state.selectedLayerId === layerId`, set `selectedLayerId = null`.

- **Seek time**
  - Inputs: `timeSeconds`
  - `state.currentTime = clamp(timeSeconds, 0, activeTemplate.duration)`.

- **Play / pause**
  - `state.isPlaying = true/false`.
  - Playback loop uses this flag to start/stop updates.

- **Change zoom**
  - `state.zoom = clamp(newZoom, ZOOM_MIN, ZOOM_MAX)`.

- **Export start / finish**
  - Start:
    - `isExporting = true`
    - `isPlaying = false`
    - Save current zoom, set `zoom = 1` (for consistent export)
  - Finish:
    - `isExporting = false`
    - Reset `currentTime = 0`
    - Restore previous zoom

---

### 4. Playback implementation

The playback engine only needs to update `currentTime` at a steady rate and respect `duration`.

#### 4.1 Core idea

- Use `requestAnimationFrame` (browser) or a timer (`setInterval`) to drive playback.
- On each tick:
  - If `state.isPlaying` is false, skip.
  - Compute a time delta (e.g., ~1/60s).
  - `state.currentTime += delta`.
  - If `currentTime >= duration`:
    - Stop playback and reset to 0 (current behavior), or
    - Loop by `currentTime -= duration` (optional behavior).

#### 4.2 Pseudocode

```ts
let lastTimestamp: number | null = null;

function tick(timestamp: number) {
  if (!state.isPlaying || !state.activeTemplate) {
    lastTimestamp = null;
    requestAnimationFrame(tick);
    return;
  }

  if (lastTimestamp == null) {
    lastTimestamp = timestamp;
  }

  const deltaMs = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  const deltaSeconds = deltaMs / 1000;
  const duration = state.activeTemplate.duration;

  state.currentTime += deltaSeconds;

  if (state.currentTime >= duration) {
    state.currentTime = 0;
    state.isPlaying = false; // or keep playing and wrap, depending on UX
  }

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
```

In the provided codebase, a simplified fixed delta (`~0.016`) is used rather than real elapsed time for ease of implementation.

---

### 5. Canvas responsibilities

The canvas is responsible for:

1. **Determining which layers are visible at the current time**
2. **Computing per-layer animation state**
3. **Rendering each layer onto the preview surface**
4. **Handling drag operations to update layer positions**
5. **Respecting `isExporting` to switch to deterministic, high-res rendering**

#### 5.1 Visibility

For each layer:

```ts
const visible =
  state.currentTime >= layer.start &&
  state.currentTime <= layer.end;
```

If not visible, skip rendering that layer.

#### 5.2 Animation progress

Choose an **animation window length**, e.g. `ANIMATION_DURATION = 0.5` seconds.

For a visible layer:

```ts
const timeSinceStart = state.currentTime - layer.start;
const progress = clamp(timeSinceStart / ANIMATION_DURATION, 0, 1);
```

`progress` is a number from 0 to 1 used to interpolate between `initial` and `animate`.

#### 5.3 Interpolation

For each property `prop` defined in your `AnimationStyle`:

```ts
function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

const style: AnimationStyle = {};

if (anim.initial.opacity != null && anim.animate.opacity != null) {
  style.opacity = interpolate(anim.initial.opacity, anim.animate.opacity, progress);
}

// repeat for scale, x, y, rotate, rotateX, rotateY, blur, etc.
```

For blur filters:

- Parse numbers out of strings like `"blur(10px)"` and interpolate those.
- Rebuild a string like `"blur(5px)"` for the current frame.

#### 5.4 Combining layout & animation

Final rendered style is conceptually:

```ts
const layoutStyle = {
  left: `${layer.style.x}%`,
  top: `${layer.style.y}%`,
  width: layer.style.width ? `${layer.style.width}%` : 'auto',
  height: layer.style.height ? `${layer.style.height}%` : 'auto',
  zIndex: layer.style.zIndex,
};

const animationTransform = `
  scale(${style.scale ?? 1})
  translate(${style.x ?? 0}px, ${style.y ?? 0}px)
  rotate(${style.rotate ?? 0}deg)
  rotateX(${style.rotateX ?? 0}deg)
  rotateY(${style.rotateY ?? 0}deg)
`;

const finalStyle = {
  ...layoutStyle,
  opacity: style.opacity ?? 1,
  filter: style.filter ?? 'none',
  transform: animationTransform,
};
```

You can implement this in DOM, Canvas2D, WebGL, or any other rendering system by mapping these values to the appropriate transforms.

#### 5.5 Dragging layers

To support dragging on the canvas:

1. On `mousedown`:
   - Record:
     - `startMouseX`, `startMouseY`
     - `startX = layer.style.x`, `startY = layer.style.y`
   - Set `draggingLayerId = layer.id`.
2. On global `mousemove`:
   - Compute mouse deltas:

     ```ts
     const deltaX = mouseX - startMouseX;
     const deltaY = mouseY - startMouseY;
     ```

   - Convert to percentages based on canvas dimensions:

     ```ts
     const deltaXPercent = (deltaX / canvasWidth) * 100;
     const deltaYPercent = (deltaY / canvasHeight) * 100;
     ```

   - New position:

     ```ts
     const newX = startX + deltaXPercent;
     const newY = startY + deltaYPercent;
     updateLayer(layer.id, { style: { ...layer.style, x: newX, y: newY } });
     ```

3. On `mouseup`:
   - Clear `draggingLayerId`.
   - Remove `mousemove` / `mouseup` listeners.

#### 5.6 Export mode

When `isExporting` is true:

- Use a **separate instance** of the canvas configured for export:
  - Fixed pixel size (e.g. `1920x1080`).
  - No zoom (`scale(1)`).
  - Deterministic layout (no editor-specific decorations, selection borders, etc.).
- Bypass animation libraries that rely on time; instead, use **your explicit animation calculation** based on `currentTime` (as described above).
- Optionally adjust style values for high DPI using a `resolutionScale` factor (e.g., multiply font sizes and paddings).

---

### 6. Panels and timeline

#### 6.1 Layers panel

Responsibilities:

- Show **all layers** (often reversed so top-most visually appears first).
- Indicate the **selected layer**.
- Provide **actions**:
  - Select layer
  - Delete layer
  - (Optional) toggle visibility or lock

Implementation outline:

- Render a list of rows.
- For each row:
  - Display icon based on `layer.type`.
  - Show `layer.name`, `layer.type`, and `start–end` time.
  - On click: `setSelectedLayerId(layer.id)`.
  - On delete icon click: `deleteLayer(layer.id)` (and stop propagation).

The panel is a pure view; it does not own the data.

#### 6.2 Properties panel

Responsibilities:

- Show and edit properties of the **currently selected layer**.

Fields:

- **Basic**
  - Name
- **Text-specific**
  - Content text
  - Font size
  - Color
- **Timing**
  - Start time (seconds)
  - End time (seconds)
- **Position**
  - X (%)
  - Y (%)
- **Animation**
  - Dropdown of `AnimationKey` values.

Implementation outline:

- If `selectedLayerId` is null → show placeholder.
- Otherwise:
  - Resolve `selectedLayer`.
  - Bind form inputs to layer fields.
  - On change, call `updateLayer(layer.id, updates)`.

#### 6.3 Timeline

Responsibilities:

- Visualize the **duration** and **layer intervals**.
- Provide a **time ruler** for click-to-seek.
- Show a **playhead** indicating `currentTime`.
- Allow selecting a layer by clicking its clip.

Key calculations:

- Ruler + playhead:

  ```ts
  const playheadLeftPercent = (currentTime / duration) * 100;
  ```

- Layer clip positioning:

  ```ts
  const clipLeftPercent = (layer.start / duration) * 100;
  const clipWidthPercent = ((layer.end - layer.start) / duration) * 100;
  ```

- Click-to-seek:

  ```ts
  function onTimelineClick(mouseX: number, timelineLeft: number, timelineWidth: number) {
    const ratio = (mouseX - timelineLeft) / timelineWidth;
    const time = clamp(ratio, 0, 1) * duration;
    setCurrentTime(time);
  }
  ```

Optional extensions:

- Dragging clips to move layers in time.
- Dragging left/right handles to adjust `start` and `end`.

---

### 7. Export pipeline

You can re-use the same conceptual pipeline regardless of platform.

#### 7.1 Steps

1. **Prepare an export surface**
   - A DOM element or canvas that:
     - Renders the scene at the target resolution (e.g. `1920x1080`).
     - Uses the **same state** (`layers`, `currentTime`) as the editor.
     - Does not show editing UI.
2. **Frame loop**
   - Determine:

     ```ts
     const totalFrames = Math.ceil(duration * fps);
     const frameDurationSeconds = 1 / fps;
     ```

   - For each frame index `i` from `0` to `totalFrames - 1`:
     - Compute `time = i * frameDurationSeconds`.
     - Set editor state to that time via `seekTo(time)` (i.e., `setCurrentTime(time)`).
     - Wait for the render to finish (e.g. next tick or a small timeout).
     - Capture an image of the export surface:
       - DOM: use `html-to-image` or similar to get an `HTMLCanvasElement`.
       - Canvas: render directly into a `canvas`.
     - Convert the captured frame into the input type for your encoder:
       - Browser/WebCodecs: `new VideoFrame(canvas, { timestamp, duration })`.
       - Backend/ffmpeg: PNG/JPEG buffer or raw RGBA.
3. **Encode and mux**
   - If using **WebCodecs**:
     - Configure `VideoEncoder` with the desired codec and bitrate.
     - Pass each frame to `encoder.encode(frame, options)`.
     - After last frame, `encoder.flush()`.
   - Use an MP4 muxer (or ffmpeg) to combine encoded frames into an MP4 container.
4. **Deliver output**
   - In-browser: wrap the final buffer in a `Blob` and trigger download.
   - In another app: save to disk, upload to storage, or stream to client.

#### 7.2 Swapping technologies

- If WebCodecs is not available:
  - You can:
    - Send frames to a backend with ffmpeg.
    - Use ffmpeg compiled to WebAssembly in the browser.
- If you are in a native environment:
  - Replace DOM capture with your own render-to-texture.
  - Use a native library (e.g. AVFoundation, ffmpeg) to encode frames into MP4.

The **frame loop and animation timing** logic stay the same.

---

### 8. Integration checklist for a new app

To implement this editor in another application:

1. **Recreate the data model**
   - Implement `Template`, `Layer`, `LayerStyle`, and `AnimationVariant`.
   - Decide where templates live (JSON, DB, API).
2. **Build the editor state store**
   - Track `activeTemplate`, `layers`, `currentTime`, `isPlaying`, `selectedLayerId`, `zoom`, `isExporting`.
   - Implement actions:
     - Load template
     - Select layer
     - Update layer
     - Delete layer
     - Seek time
     - Play/pause
     - Export start/finish
3. **Implement the canvas view**
   - Given `layers` and `currentTime`:
     - Filter visible layers.
     - Compute animation progress and transforms.
     - Render each layer (image/text) with correct layout.
   - Add drag-to-move behavior to update `style.x`/`style.y`.
4. **Implement side panels**
   - **Layers panel**:
     - List all layers.
     - On click → select.
     - On delete → remove.
   - **Properties panel**:
     - Show/edit basic, text, timing, position, and animation fields.
5. **Implement the timeline**
   - Time ruler with click-to-seek.
   - Clips for each layer using start/end/duration to compute left/width.
   - Click on a clip selects that layer.
6. **Wire playback**
   - Add an animation loop (e.g. `requestAnimationFrame`) to advance `currentTime` while `isPlaying` is true.
7. **Wire export**
   - Create a high-res export surface.
   - Implement the frame loop:
     - Seek → render → capture → encode.
   - Provide a way to download or store the final video file.

Once these pieces are wired together, you will have **functionally the same editor** that can live inside any app, regardless of framework or platform. You can then customize the UI, add more layer types, implement drag-to-resize on the timeline, add audio, and more, without changing the core concepts described above.



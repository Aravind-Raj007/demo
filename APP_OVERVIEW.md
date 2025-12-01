### AdCreator Overview

This project is a **browser-based video ad editor and exporter** built with **Next.js** and **React**.  
It lets non-technical users quickly:

- **Choose a ready-made video ad template**
- **Customize the text, timing, and layout**
- **Preview the animation in the browser**
- **Export the result as an MP4 video file**

This document explains the app in plain language so anyone can understand what it does and how to use it.

---

### 1. What you can do with this app

- **Browse templates**  
  On the home page (`/`), you see a set of pre-built ad templates such as:
  - Product Launch
  - Summer Sale
  - We Are Hiring

- **Open the visual editor**  
  When you click **“Start Creating”** or a specific template card, you go to the editor page (`/editor`), where you see:
  - A **canvas** showing a preview of the ad
  - A **layers list** on the left
  - A **properties panel** on the right
  - A **timeline** at the bottom

- **Customize the ad**
  - Change **text** (headlines, subtext, call-to-action).
  - Adjust **when** each element appears on screen (start/end time).
  - Adjust **where** elements appear (x/y position).
  - Select an **animation** for each element (fade, slide, zoom, etc.).

- **Preview the animation**
  - Use the **play / pause** button under the canvas.
  - Drag the **time slider** or click in the **timeline ruler** to scrub to a specific moment.

- **Export to MP4**
  - Click **“Export Video”** in the top-right of the editor.
  - The app renders each frame in the browser and downloads an **`.mp4` video** of your ad.

- **Save your custom template**
  - Click **“Save JSON”** to download the structure of your customized ad as a JSON file.
  - You can later re-use this data as a template (for example by loading it in code).

---

### 2. Main screens

#### Home page (`/`)

- Shows the **AdCreator** brand and marketing copy (“Create Stunning Video Ads”).
- Lets you:
  - Open the editor directly.
  - Or pick a **specific template**, which pre-selects that layout in the editor.

#### Editor page (`/editor`)

The editor is divided into four main zones:

- **Layers Panel (left)**  
  A list of all elements in the ad (images, text blocks). You can:
  - See their names, types, and time range.
  - Select a layer to edit it.
  - Delete a layer.

- **Canvas (center)**  
  A live preview of the current frame:
  - Shows only the layers that are visible at the current time.
  - Lets you drag elements around the canvas to change their position.
  - Has zoom controls so you can see more detail.

- **Properties Panel (right)**  
  Shows settings for the selected layer:
  - **Name** of the layer.
  - **Text content** (for text layers).
  - **Timing** (start / end time in seconds).
  - **Position** (x / y, in percentages of the canvas).
  - **Animation type** (fade, slide, zoom, etc.).

- **Timeline (bottom)**  
  A horizontal strip that shows:
  - A **time ruler** with marks (0s, 1s, 2s, …).
  - A **playhead** that moves when you play or scrub.
  - One **clip per layer**, showing when that layer is visible.

---

### 3. How the data is structured (non-technical view)

Behind the scenes, each ad is defined as:

- A **total duration** in seconds (how long the ad runs).
- A list of **layers**, where each layer describes one visual element:
  - **Type**: image or text
  - **Content**:
    - `src` for images (URL of the picture)
    - `content` for text (the string to display)
  - **Timing**: when it appears (`start`) and disappears (`end`)
  - **Style**: where it sits and how it looks (x/y, size, color, font, etc.)
  - **Animation**: how it moves/fades in (fadeIn, slideInLeft, zoomIn, etc.)

The editor UI is just a *friendly view* over this data:

- Moving a layer on the canvas updates its **x / y** values.
- Changing the start/end in the properties updates the **timing**.
- Changing the dropdown for animation updates the **animation** key.

---

### 4. How playback works (conceptually)

- The editor keeps track of a single value: **current time** (in seconds).
- For each frame:
  - It checks which layers should be visible at that time (between `start` and `end`).
  - It calculates how far into the layer’s animation we are (a progress from 0 to 1).
  - It uses that progress to compute style changes like position, opacity, rotation, etc.
- When you hit **Play**:
  - The app updates the current time in small steps (about 60 times per second).
  - The canvas re-renders accordingly, giving you the animation preview.

---

### 5. How export works (high level)

When you click **“Export Video”**:

1. The editor:
   - Stops playback.
   - Creates a **hidden high-resolution canvas** for export (1920×1080).
2. For each frame of the video:
   - It picks a time value (e.g. frame 0 = 0s, frame 1 = 1/30s, etc.).
   - It tells the editor to **seek** to that exact time.
   - It waits briefly so the UI reflects that time.
   - It **captures the canvas as an image** using `html-to-image`.
   - It passes the captured frame to the **browser’s video encoder** (WebCodecs).
3. After all frames are encoded:
   - Frames are combined into a finished **MP4 video file**.
   - The browser triggers a **download** of that `.mp4` file.

This entire process runs **in your browser**, without any backend server.

---

### 6. Quick start for new users

1. **Install dependencies and run the dev server**

   ```bash
   npm install
   npm run dev
   ```

2. **Open the app**  
   Visit `http://localhost:3000` in your browser.

3. **Pick a template**  
   Scroll through the templates on the home page and click one you like.

4. **Customize**
   - Use the **layers panel** to pick which element to edit.
   - Use the **properties panel** to change text, timing, position, colors, and animation.
   - Drag elements on the **canvas** to reposition them.

5. **Preview**
   - Use the **play** button under the canvas.
   - Scrub the **time slider** or click in the **timeline ruler**.

6. **Export**
   - Click **“Export Video”**.
   - Wait for the export overlay to finish.
   - Your browser will download an **MP4 file** of your ad.

---

### 7. Notes for developers

- **Tech stack**
  - Next.js (App Router)
  - React
  - Tailwind CSS for styling
  - `framer-motion` for in-editor animations
  - `html-to-image` + WebCodecs + `mp4-muxer` for video export

- **Key files**
  - `src/app/page.js` – Home page and template grid.
  - `src/app/editor/page.js` – Main editor layout and state management.
  - `src/components/Canvas.js` – Renders layers and handles dragging + animation interpolation.
  - `src/components/LayersPanel.js` – Shows and manages the layers list.
  - `src/components/PropertiesPanel.js` – Edits layer properties.
  - `src/components/Timeline.js` – Time ruler and per-layer clips.
  - `src/data/templates.js` – Built-in templates.
  - `src/data/animations.js` – Named animation presets.
  - `src/utils/VideoExporter.js` – Frame-by-frame DOM capture and MP4 export.

If you are extending the app, this document gives you the overall mental model; from here you can open the files above to see the exact implementation details.



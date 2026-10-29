# Spec: Virgil Live Wallpaper

Labels: `ready-for-agent`

## Problem Statement

My desktop cycles through five Halo 3: ODST "Superintendent" (Virgil) wallpapers. They're really one image: the same black HUD frame, white circuit lines and terminal text ("WARNING: METROPOLITAN DISASTER / REINITIALIZING... / PLEASE STAND BY..."), with only Virgil's eyes and the bottom caption changing between them. The slideshow got boring fast. The images are also fixed 4K PNGs, so they get scaled down on my 1080p laptop and won't fit the layout on a 1440p ultrawide.

## Solution

A live, animated HTML wallpaper for Lively Wallpaper that brings Virgil to life. It keeps the current look (black background, thin white HUD lines, green Virgil face, all-caps terminal text) but rebuilds it as resolution-independent vector art with subtle ODST touches: faint rain, occasional HUD flicker, and terminal text that types itself out.

Virgil reacts to the PC. He falls asleep when I'm idle, looks alarmed when the CPU is pegged, gets drowsy late at night, and otherwise blinks, glances and winks while his eyes follow my cursor. His caption rotates through real Superintendent sign messages, plus state-reactive ones in the same voice. The terminal shows a live clock. On battery, all animation stops, but the scene still updates once a minute. It works at 1920×1080, 2560×1440 and 3440×1440.

## User Stories

1. As a desktop user, I want the wallpaper to look like my existing Virgil images, so that it still feels like my wallpaper.
2. As a desktop user, I want the art drawn as vectors at native resolution, so that lines and text are crisp instead of downscaled.
3. As a 1080p laptop user, I want the layout to fill a 1920×1080 screen correctly, so that nothing is cropped or blurry.
4. As a 1440p monitor user, I want the layout to fill a 2560×1440 screen correctly, so that it looks right on my external display.
5. As an ultrawide user, I want the HUD frame lines to stretch the full width of a 3440×1440 screen, so that the composition doesn't look boxed in.
6. As an ultrawide user, I want the terminal text to stay anchored top-left and Virgil to stay anchored bottom-right, so that the extra width becomes open space, not distortion.
7. As a desktop user, I want Virgil's proportions to never stretch or squash, so that he always looks like a circle with proper eyes.
8. As a desktop user, I want the terminal lines to type themselves out when the wallpaper loads, so that it feels like a system booting up.
9. As a desktop user, I want a live clock line in the terminal, so that the wallpaper shows useful information.
10. As a desktop user, I want to choose a 12h or 24h clock, so that it matches my preference.
11. As a desktop user, I want Virgil to blink at random, natural intervals, so that he feels alive.
12. As a desktop user, I want Virgil to occasionally glance or wink (like the existing "CORE DATA CORRUPTION" image), so that he has personality.
13. As a desktop user, I want Virgil's eyes to follow my cursor, so that he feels aware of me.
14. As a desktop user, I want eye tracking to be limited to a small offset inside the face, so that it stays subtle and in character.
15. As a desktop user, I want Virgil to fall asleep after I've been idle for a set time, so that the wallpaper reflects that I'm away.
16. As a desktop user, I want the asleep state to show closed eyes, slow "breathing" and the caption ">> PLEASE STAND BY <<", so that it reads clearly as asleep.
17. As a desktop user, I want Virgil to wake as soon as I move the mouse, so that he reacts when I come back.
18. As a desktop user, I want Virgil to look alarmed when CPU stays high for a sustained period, so that the wallpaper hints the machine is under load.
19. As a desktop user, I want brief CPU spikes to be ignored, so that Virgil doesn't twitch between moods.
20. As a desktop user, I want the alarmed state to use captions like ">> HIGH TRAFFIC DETECTED <<" or ">> CORE DATA CORRUPTION <<", so that it fits the game's voice.
21. As a desktop user, I want Virgil to look drowsy between 11pm and 6am with the caption ">> CURFEW IN EFFECT <<", so that late-night use feels different.
22. As a desktop user, I want asleep to take priority over alarmed, alarmed over drowsy, and drowsy over default, so that conflicting signals resolve predictably.
23. As a desktop user, I want the eyes not to follow the cursor while Virgil is asleep, so that sleep looks like sleep.
24. As a desktop user, I want default-state captions to rotate every 2–3 minutes, so that the wallpaper changes without being distracting.
25. As a desktop user, I want caption changes to use a short glitch/flicker transition, so that they feel like an in-world sign updating.
26. As an ODST fan, I want captions drawn from real Superintendent sign messages (e.g. "OBEY POSTED LIMITS", "PLEASE STAND BY", "CORE DATA CORRUPTION", "EVACUATION ORDER IN EFFECT", "THANK YOU FOR YOUR PATIENCE"), so that it feels authentic.
27. As an ODST fan, I want any invented captions to read like New Mombasa signage and never like jokes, so that the tone stays consistent.
28. As a desktop user, I want the same caption not to repeat back-to-back, so that the rotation feels varied.
29. As a desktop user, I want faint diagonal rain at about 10% opacity, so that it evokes ODST's rainy night without hurting readability.
30. As a desktop user, I want an occasional subtle flicker on the HUD lines, so that the frame feels like a real display.
31. As a desktop user, I want no full-screen scanlines, so that whatever is behind my windows doesn't look dirty.
32. As a desktop user, I want no sound, so that the wallpaper never makes noise on a work machine.
33. As a laptop user, I want all animation to stop on battery (rain, flicker, typing, blinking, eye tracking, transitions), so that the wallpaper doesn't drain power.
34. As a laptop user, I want the scene to redraw once a minute on battery, so that the clock, mood and caption stay current.
35. As a laptop user, I want animation to resume when I plug in, so that I don't have to do anything.
36. As a desktop user, I want animation capped at about 30 fps when running, so that the wallpaper barely registers in Task Manager.
37. As a desktop user, I want the wallpaper to pause behind full-screen or maximised apps (via Lively's built-in setting), so that it doesn't waste resources.
38. As a desktop user, I want to turn rain on or off in Lively's settings panel, so that I can control the busiest effect.
39. As a desktop user, I want to set the idle timeout (default 10 minutes) in Lively's settings panel, so that sleep matches my habits.
40. As a desktop user, I want to set the CPU alarm threshold (default 85%) in Lively's settings panel, so that I can tune how jumpy Virgil is.
41. As a desktop user, I want to change Virgil's face colour (default the original muted green) in Lively's settings panel, so that I can restyle him.
42. As a desktop user, I want settings changes to apply immediately without reloading, so that I can see the effect while tuning.
43. As a desktop user, I want the wallpaper to keep working with sensible defaults if system information isn't available, so that it never shows a broken screen.
44. As a desktop user, I want the original PNGs left untouched, so that I can always go back to the slideshow.
45. As a desktop user, I want the project to live in a subfolder next to the PNGs and sync via OneDrive, so that it's backed up and in one place.

## Implementation Decisions

- **Platform:** a Lively Wallpaper "web" wallpaper (HTML/CSS/JS rendered in Lively's WebView2 host). It's a plain folder with an entry HTML page, Lively metadata (`LivelyInfo.json`) and a Lively properties file for the settings panel. No build step, no frameworks, no network calls, no external assets.
- **Rendering:** draw everything as vectors (SVG or canvas) from a single scene description. Don't reuse the PNGs as assets.
- **Architecture: one deep, pure module, `computeScene`, and thin shells around it.**
  - `computeScene(inputs, previousScene) → scene` is pure and deterministic, given a seeded random source for blink/glance/caption choices. It owns every behavioural rule: mood priority, thresholds, curfew window, sustained-CPU smoothing, caption selection and timing, battery behaviour, and layout per viewport.
  - **Inputs:** current time, CPU load sample, ms since last input, cursor position, on-battery flag, viewport width/height, user settings (rain, clock format, idle timeout, CPU threshold, face colour), random source.
  - **Scene output:** mood (`asleep` | `alarmed` | `drowsy` | `default`), eye shapes and eye offset, caption text and whether a caption transition is in progress, terminal lines (including formatted clock), layout geometry (frame line endpoints, terminal anchor, Virgil anchor and radius), effect flags (rain, flicker, typing, motion), and the next update interval (animation frame vs 60 s).
  - **Renderer:** draws a scene. It holds no rules.
  - **Input adapter:** wires Lively's hooks (property listener for settings, system-information callback for CPU), mouse movement (cursor position and last-input time) and battery status into `computeScene`'s inputs, then schedules the next tick from the scene's update interval.
- **Mood priority:** asleep (idle ≥ timeout) > alarmed (CPU ≥ threshold, sustained) > drowsy (local time 23:00–06:00) > default.
- **Sustained CPU:** use a rolling average or hold time so short spikes don't trigger alarmed. Alarmed should also persist briefly after load drops, to avoid flapping. Pick the exact window during implementation and keep it inside `computeScene`.
- **Eye tracking:** applies in alarmed, drowsy and default. Clamp the offset to a small radius inside the face.
- **Captions:** a fixed in-module list per mood. Default rotates every 2–3 minutes (randomised) with no immediate repeats. Mood changes switch captions immediately.
- **Layout:** the HUD frame's long horizontal lines stretch to the viewport width. The terminal block anchors top-left and Virgil anchors bottom-right, both sized from viewport height so they never distort. Target viewports: 1920×1080, 2560×1440 and 3440×1440.
- **Battery:** when on battery, every motion flag is off and the update interval is 60 s. Prefer the browser battery API inside WebView2. If it's unavailable, assume plugged in.
- **Frame rate:** cap animation at ~30 fps.
- **Settings panel (Lively properties):** rain on/off (default on), 12h/24h clock (default 24h), idle timeout in minutes (default 10), CPU threshold % (default 85), face colour (default the original muted green). Changes apply live.
- **Fallbacks:** with no CPU data, never enter alarmed. With no input events ever received, don't treat that as idle until the timeout has elapsed since load.
- **Location:** this folder (`Virgil\lively-wallpaper\`). The original PNGs in the parent folder are left unchanged.

## Testing Decisions

- **Seam:** test only `computeScene`. It's the single place where behaviour lives. The renderer and input adapter stay thin and are checked by eye in Lively.
- **What a good test looks like:** feed in concrete inputs and assert on the scene's externally meaningful fields (mood, caption, effect flags, update interval, anchor positions). Don't assert on internal helpers or intermediate state.
- **Runner:** Node's built-in test runner (`node --test`), no dependencies. `computeScene` is a classic script that exposes a browser global and also works with Node's `require`. It isn't an ES module, because Chromium blocks module scripts loaded over `file://`.
- **Cases to cover:**
  - Mood priority: idle beyond the timeout with CPU at 95% at 02:00 → asleep. CPU sustained high at 02:00 → alarmed. 02:00 with normal load → drowsy. 14:00 with normal load → default.
  - Curfew boundaries at 22:59, 23:00, 05:59 and 06:00.
  - A short CPU spike doesn't trigger alarmed. Sustained load does. Alarmed doesn't flap off the moment load dips.
  - Idle timeout and CPU threshold settings change the outcomes accordingly.
  - Eye offset follows the cursor and is clamped. It's zero or absent when asleep.
  - Caption rotation respects the 2–3 minute window, never repeats back-to-back, and switches immediately on mood change.
  - On battery: all motion flags off and a 60 s update interval. Off battery: motion on and frame-rate interval. Rain off in settings → no rain even when plugged in.
  - Clock formatting for 12h and 24h.
  - Layout at 1920×1080, 2560×1440 and 3440×1440: Virgil bottom-right with an undistorted circle, terminal top-left, frame lines spanning the full width.
  - Missing CPU data never produces alarmed.
- **Prior art:** none. This is a new folder with no existing code or tests.

## Out of Scope

- Sound of any kind.
- Weather, calendar or any network-sourced data.
- Wallpaper Engine support, or video/GIF exports.
- Static-image variants for the Windows slideshow.
- Multi-monitor coordination (each monitor runs its own instance independently).
- Changing or deleting the original PNGs.
- Disabling the Windows slideshow and installing Lively. These are manual steps for the user.

## Further Notes

- The face colour, eye shapes, HUD line geometry and caption typography should be traced from the existing PNGs in the parent folder: muted green face with a white rim, half-moon eyes, a circle-and-crosshair "W" marker on the left, and a diamond-and-step line feeding into the bottom rule.
- Lively's exact hook names and the metadata flag that enables system-information callbacks should be checked against Lively's current documentation during implementation.
- Lively only forwards mouse movement to the wallpaper when the cursor is over the desktop, and keyboard input isn't visible at all. So idle detection is "no mouse movement over the desktop" and may put Virgil to sleep while I'm typing in a maximised window. That's acceptable, because Lively pauses the wallpaper behind maximised windows anyway.
- **Revision (2026-10-29): the clock is replaced by a spinner.** The terminal no longer shows a clock, and the 12h/24h setting is gone. Line 1 is a mood header. Lines 2–3 are a log of New Mombasa status messages. Line 4 is a spinner word (Claude Code's spinner words plus Virgil-themed extras) with animated dots. The word changes the way Claude Code's does: a `▌` cursor sweeps over the old word at 40 ms per character, with `.`/`_` noise in the two cells behind it. The status pool has 115 lines, all set in New Mombasa: ODST events plus deadpan city-admin humour. Halo 3 tie-ins were tried and removed. Every 5–12 seconds, at random, the word changes: a new status line types in, the log scrolls up, and the oldest line drops off. While Virgil is asleep, the spinner shows `HIBERNATING` and the log freezes. On battery, the log advances once per minute redraw with no animation. Any user stories above about the clock are superseded.
- **Revision (2026-10-29): rain removed.** Rain was first too faint to see at 10% opacity, then too much once made stronger, so it's gone entirely, along with its setting. Any user stories above about rain are superseded.
- Manual setup after building: install Lively, add this folder as a wallpaper, enable "pause when an app is fullscreen/maximised", and turn off the Windows slideshow.

const test = require('node:test');
const assert = require('node:assert/strict');
const { computeScene, mulberry32, CAPTIONS, HEADERS, STATUS_LINES, SPINNER_WORDS } = require('../scene.js');

const MIN = 60000;
const loopRand = mulberry32(7);

// Local-time dates so curfew tests don't depend on the machine's timezone.
function at(h, m = 0, s = 0) {
  return new Date(2026, 9, 28, h, m, s);
}

function inputs(overrides = {}) {
  return {
    date: at(14),
    cpu: 20,
    idleMs: 0,
    cursor: null,
    onBattery: false,
    width: 1920,
    height: 1080,
    settings: {},
    rand: mulberry32(42),
    ...overrides,
  };
}

// Feed a sequence of ticks, carrying the scene forward like the real loop.
// One random stream per run, as in the real wallpaper.
function run(base, steps) {
  let scene = null;
  let t = base.date.getTime();
  const rand = mulberry32(42);
  for (const step of steps) {
    t += step.dt ?? 0;
    scene = computeScene(inputs({ ...base, ...step, date: new Date(t), rand }), scene);
  }
  return scene;
}

function sustainedCpu(base, cpu, seconds) {
  return Array.from({ length: seconds + 1 }, (_, i) => ({ cpu, dt: i === 0 ? 0 : 1000, ...base }));
}

test('mood priority: idle beats high CPU beats curfew beats default', () => {
  const busyAt2am = sustainedCpu({}, 100, 60);
  assert.equal(run(inputs({ date: at(2) }), [...busyAt2am, { idleMs: 11 * MIN, cpu: 100 }]).mood, 'asleep');
  assert.equal(run(inputs({ date: at(2) }), busyAt2am).mood, 'alarmed');
  assert.equal(computeScene(inputs({ date: at(2) })).mood, 'drowsy');
  assert.equal(computeScene(inputs({ date: at(14) })).mood, 'default');
});

test('curfew runs from 23:00 to 05:59', () => {
  assert.equal(computeScene(inputs({ date: at(22, 59) })).mood, 'default');
  assert.equal(computeScene(inputs({ date: at(23, 0) })).mood, 'drowsy');
  assert.equal(computeScene(inputs({ date: at(5, 59) })).mood, 'drowsy');
  assert.equal(computeScene(inputs({ date: at(6, 0) })).mood, 'default');
});

test('a short CPU spike does not trigger alarmed, sustained load does', () => {
  const spike = [...sustainedCpu({}, 20, 30), ...sustainedCpu({}, 100, 3).slice(1)];
  assert.equal(run(inputs(), spike).mood, 'default');
  assert.equal(run(inputs(), sustainedCpu({}, 100, 30)).mood, 'alarmed');
});

test('alarmed holds briefly after load drops, then clears', () => {
  const busy = sustainedCpu({}, 100, 40);
  const justAfter = run(inputs(), [...busy, { cpu: 10, dt: 1000 }]);
  assert.equal(justAfter.mood, 'alarmed');
  const calm = run(inputs(), [...busy, ...sustainedCpu({}, 5, 90).slice(1)]);
  assert.equal(calm.mood, 'default');
});

test('missing CPU data never produces alarmed', () => {
  assert.equal(run(inputs(), sustainedCpu({}, null, 60)).mood, 'default');
  assert.equal(run(inputs(), sustainedCpu({}, undefined, 60)).mood, 'default');
});

test('idle timeout and CPU threshold settings change outcomes', () => {
  assert.equal(computeScene(inputs({ idleMs: 3 * MIN })).mood, 'default');
  assert.equal(computeScene(inputs({ idleMs: 3 * MIN, settings: { idleMinutes: 2 } })).mood, 'asleep');
  assert.equal(run(inputs(), sustainedCpu({}, 60, 60)).mood, 'default');
  assert.equal(run(inputs(), sustainedCpu({ settings: { cpuThreshold: 50 } }, 60, 60)).mood, 'alarmed');
});

test('mood captions: asleep, drowsy and alarmed use their own signs', () => {
  assert.equal(computeScene(inputs({ idleMs: 11 * MIN })).caption.text, 'PLEASE STAND BY');
  assert.equal(computeScene(inputs({ date: at(1) })).caption.text, 'CURFEW IN EFFECT');
  assert.ok(CAPTIONS.alarmed.includes(run(inputs(), sustainedCpu({}, 100, 30)).caption.text));
  assert.ok(CAPTIONS.default.includes(computeScene(inputs()).caption.text));
  assert.match(computeScene(inputs()).caption.display, /^>> .+ <<$/);
});

test('alarmed turns Virgil red with angry eyes', () => {
  // On battery so a random blink can't land on the frame we check.
  const s = run(inputs({ onBattery: true }), sustainedCpu({ onBattery: true }, 100, 30));
  assert.notEqual(s.face.color, computeScene(inputs()).face.color);
  assert.deepEqual(s.face.eyes, { left: 'angry', right: 'angry' });
});

test('caption rotates within 2-3 minutes and never repeats back-to-back', () => {
  let scene = computeScene(inputs());
  const start = scene.caption.text;
  let t = at(14).getTime();
  let changedAfter = null;
  for (let i = 1; i <= 200; i++) {
    t += 1000;
    scene = computeScene(inputs({ date: new Date(t), rand: loopRand }), scene);
    if (scene.caption.text !== start) { changedAfter = i; break; }
  }
  assert.ok(changedAfter >= 120 && changedAfter <= 181, `changed after ${changedAfter}s`);

  let last = scene.caption.text;
  for (let i = 0; i < 20; i++) {
    t += 3 * MIN;
    scene = computeScene(inputs({ date: new Date(t), rand: loopRand }), scene);
    assert.notEqual(scene.caption.text, last);
    last = scene.caption.text;
  }
});

test('caption switches immediately on mood change, with a glitch', () => {
  const awake = computeScene(inputs());
  const asleep = computeScene(inputs({ date: new Date(at(14).getTime() + 1000), idleMs: 11 * MIN }), awake);
  assert.equal(asleep.caption.text, 'PLEASE STAND BY');
  assert.equal(asleep.caption.glitching, true);
});

test('eyes follow the cursor within a clamped offset, but not when asleep', () => {
  const near = computeScene(inputs({ cursor: { x: 0, y: 0 } }));
  const far = computeScene(inputs({ cursor: { x: -100000, y: -100000 } }));
  const v = far.layout.virgil;
  assert.ok(near.face.eyeOffset.x < 0 && near.face.eyeOffset.y < 0);
  assert.ok(Math.hypot(far.face.eyeOffset.x, far.face.eyeOffset.y) <= v.faceR * 0.12 + 1e-9);

  const asleep = computeScene(inputs({ cursor: { x: 0, y: 0 }, idleMs: 11 * MIN }));
  assert.deepEqual(asleep.face.eyeOffset, { x: 0, y: 0 });
  assert.deepEqual(asleep.face.eyes, { left: 'closed', right: 'closed' });
});

test('on battery: all motion off and a once-a-minute redraw', () => {
  const s = computeScene(inputs({ onBattery: true, cursor: { x: 0, y: 0 }, date: at(14, 5, 20) }));
  assert.deepEqual(s.effects, { motion: false, flicker: false, typing: false, eyeTracking: false });
  assert.deepEqual(s.face.eyeOffset, { x: 0, y: 0 });
  assert.equal(s.face.scale, 1);
  assert.equal(s.updateIntervalMs, 40000); // aligned to the next minute
  assert.ok(s.updateIntervalMs <= 60000);
  assert.equal(s.terminal.lines.length, 4); // no typing animation: everything shown
});

test('plugged in: animating at ~30 fps', () => {
  const on = computeScene(inputs());
  assert.equal(on.effects.motion, true);
  assert.ok(Math.abs(on.updateIntervalMs - 1000 / 30) < 1);
});

const SPINNER_LINE = /^> ([A-Z ]+)(\.{1,3})$/;

// Step a scene forward at ~30 fps for `ms`, returning every scene produced.
function animate(scene, fromMs, ms, overrides = {}) {
  const scenes = [];
  const rand = mulberry32(fromMs);
  for (let t = fromMs + 1000 / 30; t <= fromMs + ms; t += 1000 / 30) {
    scene = computeScene(inputs({ ...overrides, date: new Date(t), rand }), scene);
    scenes.push(scene);
  }
  return scenes;
}

test('terminal boots by typing header, two status lines, then a spinner word', () => {
  const first = computeScene(inputs());
  assert.equal(first.effects.typing, true);
  assert.equal(first.terminal.lines.join(''), '');

  const booted = animate(first, at(14).getTime(), 5500).at(-1);
  assert.equal(booted.effects.typing, false);
  const [header, log1, log2, spinner] = booted.terminal.lines;
  assert.equal(header, HEADERS.default);
  assert.ok(STATUS_LINES.includes(log1.slice(2)));
  assert.ok(STATUS_LINES.includes(log2.slice(2)));
  assert.notEqual(log1, log2);
  assert.ok(SPINNER_WORDS.includes(spinner.match(SPINNER_LINE)[1]));
});

test('line 1 follows the mood and glitches when it changes', () => {
  assert.equal(computeScene(inputs({ onBattery: true })).terminal.lines[0], HEADERS.default);
  assert.equal(computeScene(inputs({ onBattery: true, date: at(2) })).terminal.lines[0], HEADERS.drowsy);
  assert.equal(computeScene(inputs({ onBattery: true, idleMs: 11 * MIN })).terminal.lines[0], HEADERS.asleep);
  const alarmed = run(inputs({ onBattery: true }), sustainedCpu({ onBattery: true }, 100, 30));
  assert.equal(alarmed.terminal.lines[0], HEADERS.alarmed);

  const awake = run(inputs(), [{}, { dt: 10000 }]);
  const asleep = computeScene(inputs({ date: new Date(at(14).getTime() + 10100), idleMs: 11 * MIN }), awake);
  assert.notEqual(asleep.terminal.lines[0], HEADERS.asleep);
  assert.equal(asleep.terminal.lines[0].length, HEADERS.asleep.length);
});

test('every 5-12 s the spinner word changes and the log scrolls up', () => {
  const t0 = at(14).getTime();
  const scenes = animate(null, t0, 120000);
  const changes = [];
  for (let i = 1; i < scenes.length; i++) {
    const a = scenes[i - 1].state.term;
    const b = scenes[i].state.term;
    if (b.changedAt !== a.changedAt) {
      changes.push(scenes[i]);
      assert.notEqual(b.word, a.word, 'word never repeats back-to-back');
      assert.equal(b.log[0], a.log[1], 'line 3 moves up to line 2');
      assert.ok(!a.log.includes(b.log[1]), 'new status line is not already on screen');
      assert.ok(scenes[i].terminal.scroll, 'scroll animation starts');
    }
  }
  const gaps = changes.slice(1).map((s, i) => s.state.term.changedAt - changes[i].state.term.changedAt);
  assert.ok(gaps.length >= 8, `only ${gaps.length} changes in two minutes`);
  assert.ok(gaps.every((g) => g >= 5000 && g <= 12100), `gaps: ${gaps.join(', ')}`);
  assert.ok(Math.max(...gaps) - Math.min(...gaps) > 2000, `gaps should vary: ${gaps.join(', ')}`);

  // The prompt never disappears while a new line types in.
  for (const s of scenes.slice(200)) {
    assert.equal(s.terminal.lines.length, 4);
    assert.ok(s.terminal.lines.every((l) => l.startsWith('>')), s.terminal.lines.join(' / '));
  }
});

test('word changes sweep a cursor over the old word, like Claude Code', () => {
  const scenes = animate(null, at(14).getTime(), 60000);
  let sweeps = 0;
  for (const s of scenes) {
    const t = s.state.term;
    if (t.sweepAt == null || s.terminal.lines.length < 4) continue;
    const line = s.terminal.lines[3].slice(2);
    const step = Math.floor((s.state.lastNow - t.sweepAt) / 40);
    const from = t.fromWord + '...';
    const to = t.shownWord + '...';
    if (step - 3 >= Math.max(from.length, to.length)) continue;
    sweeps++;
    // Ahead of the cursor: still the old word. Settled cells: the new word.
    for (let d = step + 1; d < line.length; d++) assert.equal(line[d], from[d] ?? ' ', `ahead @${d}: ${line}`);
    for (let d = 0; d <= step - 3 && d < to.length; d++) assert.equal(line[d], to[d], `settled @${d}: ${line}`);
    if (step < to.length && to[step] !== ' ') assert.equal(line[step], '▌', `cursor @${step}: ${line}`);
  }
  assert.ok(sweeps > 20, `only ${sweeps} sweep frames`);
});

test('the dots after the spinner word animate', () => {
  const scenes = animate(null, at(14).getTime(), 15000);
  const dots = new Set(scenes.map((s) => s.terminal.lines[3]?.match(SPINNER_LINE)?.[2]).filter(Boolean));
  assert.deepEqual([...dots].sort(), ['.', '..', '...']);
});

test('asleep: spinner shows HIBERNATING and the log freezes', () => {
  const t0 = at(14).getTime();
  const awake = animate(null, t0, 10000).at(-1);
  const asleep = animate(awake, t0 + 10000, 30000, { idleMs: 11 * MIN });
  const logs = new Set(asleep.map((s) => s.state.term.log.join('|')));
  assert.equal(logs.size, 1);
  assert.match(asleep.at(-1).terminal.lines[3], /^> HIBERNATING\.{1,3}$/);

  const woke = animate(asleep.at(-1), t0 + 40000, 100).at(-1);
  assert.notEqual(woke.state.term.log.join('|'), [...logs][0], 'log moves on waking');
});

test('on battery: the log moves once per redraw, with no typing, scrolling or dot animation', () => {
  let scene = computeScene(inputs({ onBattery: true }));
  assert.match(scene.terminal.lines[3], /^> [A-Z ]+\.\.\.$/);
  for (let i = 1; i <= 5; i++) {
    const before = scene.state.term;
    scene = computeScene(inputs({ onBattery: true, date: new Date(at(14).getTime() + i * MIN) }), scene);
    assert.equal(scene.state.term.log[0], before.log[1]);
    assert.equal(scene.terminal.scroll, null);
    assert.equal(scene.effects.typing, false);
    assert.match(scene.terminal.lines[3], /^> [A-Z ]+\.\.\.$/);
  }
});

test('word lists: Claude spinner words plus extras, ~40 status lines, all unique', () => {
  assert.ok(SPINNER_WORDS.includes('COMBOBULATING') && SPINNER_WORDS.includes('FLIBBERTIGIBBETING'));
  assert.ok(SPINNER_WORDS.length >= 95);
  assert.ok(STATUS_LINES.length >= 90);
  assert.equal(new Set(SPINNER_WORDS).size, SPINNER_WORDS.length);
  assert.equal(new Set(STATUS_LINES).size, STATUS_LINES.length);
});

for (const [width, height] of [[1920, 1080], [2560, 1440], [3440, 1440]]) {
  test(`layout at ${width}x${height}: terminal top-left, Virgil bottom-right, lines span the width`, () => {
    const { layout } = computeScene(inputs({ width, height }));
    const v = layout.virgil;
    assert.ok(v.cx > width * 0.8 && v.cy > height * 0.6, 'Virgil bottom-right');
    assert.ok(v.cx + v.r <= width && v.cy + v.r <= height, 'Virgil fully on screen');
    assert.ok(Math.abs(width - (v.cx + v.r) - 88 * layout.scale) < 1, 'fixed gap to right edge');
    assert.ok(layout.terminal.x < width * 0.3 && layout.terminal.y < height * 0.1, 'terminal top-left');

    const xs = layout.lines.flat().map((p) => p.x);
    assert.equal(Math.min(...xs), 0);
    assert.ok(Math.max(...xs) > width - 40 * layout.scale, 'bottom rule reaches the right edge');
  });
}

test('ultrawide keeps Virgil the same size as 1440p, only the width grows', () => {
  const qhd = computeScene(inputs({ width: 2560, height: 1440 })).layout;
  const uw = computeScene(inputs({ width: 3440, height: 1440 })).layout;
  assert.equal(uw.virgil.r, qhd.virgil.r);
  assert.equal(uw.virgil.cy, qhd.virgil.cy);
  assert.equal(uw.virgil.cx - qhd.virgil.cx, 880);
  assert.equal(uw.terminal.x, qhd.terminal.x);
});

test('default state blinks and changes expression over time', () => {
  let scene = null;
  let t = at(14).getTime();
  const seen = new Set();
  for (let i = 0; i < 120 * 30; i++) {
    t += 1000 / 30;
    scene = computeScene(inputs({ date: new Date(t), rand: loopRand }), scene);
    seen.add(scene.face.eyes.left + '/' + scene.face.eyes.right);
  }
  assert.ok(seen.has('open/open'));
  assert.ok(seen.has('closed/closed'), 'blinked');
  assert.ok(seen.size >= 3, `expressions seen: ${[...seen].join(', ')}`);
});

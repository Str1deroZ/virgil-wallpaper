// Input adapter: turns Lively hooks, mouse and battery into computeScene inputs.
(function () {
  'use strict';

  var S = window.VirgilScene;
  var R = window.VirgilRender;
  var canvas = document.getElementById('wallpaper');
  var ctx = canvas.getContext('2d');

  var settings = Object.assign({}, S.DEFAULT_SETTINGS);
  var rand = S.mulberry32((Date.now() ^ 0x9e3779b9) >>> 0);
  var cpu = null;
  var cursor = null;
  var lastInput = Date.now();
  var onBattery = false;
  var scene = null;
  var timer = null;
  var dpr = 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }

  function tick() {
    clearTimeout(timer);
    var now = Date.now();
    scene = S.computeScene({
      date: new Date(now),
      cpu: cpu,
      idleMs: now - lastInput,
      cursor: cursor,
      onBattery: onBattery,
      width: window.innerWidth,
      height: window.innerHeight,
      settings: settings,
      rand: rand,
    }, scene);
    R.render(ctx, scene, now, dpr);
    timer = setTimeout(tick, scene.updateIntervalMs);
  }

  function onInput(e) {
    if (e.clientX != null) cursor = { x: e.clientX, y: e.clientY };
    lastInput = Date.now();
    // Wake immediately, even if we're only redrawing once a minute on battery.
    if (scene && scene.mood === 'asleep') tick();
  }

  // Lively calls this once per property on load and whenever one changes.
  window.livelyPropertyListener = function (name, val) {
    switch (name) {
      case 'idleMinutes': settings.idleMinutes = Number(val); break;
      case 'cpuThreshold': settings.cpuThreshold = Number(val); break;
      case 'faceColor': {
        var hex = String(val);
        if (hex.length === 9) hex = '#' + hex.slice(3); // #AARRGGBB -> #RRGGBB
        settings.faceColor = hex;
        break;
      }
      default: return;
    }
    tick();
  };

  // Enabled by "Arguments": "--system-information" in LivelyInfo.json.
  window.livelySystemInformation = function (data) {
    try {
      var info = typeof data === 'string' ? JSON.parse(data) : data;
      if (info && typeof info.CurrentCpu === 'number') cpu = info.CurrentCpu;
    } catch (e) { /* keep last value */ }
  };

  window.addEventListener('pointermove', onInput);
  window.addEventListener('pointerdown', onInput);
  window.addEventListener('wheel', onInput);
  window.addEventListener('resize', function () { resize(); tick(); });

  if (navigator.getBattery) {
    navigator.getBattery().then(function (battery) {
      function update() {
        onBattery = !battery.charging;
        tick();
      }
      battery.addEventListener('chargingchange', update);
      update();
    }).catch(function () { /* assume plugged in */ });
  }

  resize();
  tick();
})();

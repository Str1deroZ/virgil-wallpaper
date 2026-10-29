// computeScene: every behavioural rule for the Virgil wallpaper lives here.
// Pure and deterministic given `inputs.rand`. Loaded as a classic script in
// Lively (exposes window.VirgilScene) and via require() in Node tests.
(function (root) {
  'use strict';

  var DESIGN_W = 2000;
  var DESIGN_H = 1125;

  var DEFAULT_SETTINGS = {
    idleMinutes: 10,
    cpuThreshold: 85,
    faceColor: '#6f8a5f',
  };

  var RIM_COLOR = '#fefefd';
  var TEXT_COLOR = '#ffffff';
  var ALARM_FACE = '#520000';
  var ALARM_TEXT = '#b01c1c';

  var FRAME_MS = 1000 / 30;
  var CPU_TAU_MS = 10000;      // smoothing time constant for "sustained" load
  var ALARM_HOLD_MS = 20000;   // alarmed persists this long after load drops
  var CAPTION_MIN_MS = 120000;
  var CAPTION_JITTER_MS = 60000;
  var GLITCH_MS = 700;
  var TYPE_MS_PER_CHAR = 35;
  var SPINNER_MIN_MS = 5000;
  var SPINNER_JITTER_MS = 7000;
  var SCROLL_MS = 200;
  var SWEEP_MS_PER_CHAR = 40;
  var GLITCH_CHARS = '#%&@$/\\|_<>*';

  var CAPTIONS = {
    default: [
      'OBEY POSTED LIMITS',
      'KEEP IT CLEAN',
      'PLEASE REMAIN CALM',
      'THANK YOU FOR YOUR PATIENCE',
      'EVACUATION ORDER IN EFFECT',
      'WATCH YOUR STEP',
      'REPORT SUSPICIOUS ACTIVITY',
    ],
    alarmed: [
      'HIGH TRAFFIC DETECTED',
      'CORE DATA CORRUPTION',
      'HITCHHIKERS MAY BE ESCAPED CONVICTS',
    ],
    drowsy: ['CURFEW IN EFFECT'],
    asleep: ['PLEASE STAND BY'],
  };

  // Terminal line 1: follows Virgil's mood.
  var HEADERS = {
    default: '> WARNING: METROPOLITAN DISASTER',
    alarmed: '> WARNING: SYSTEM LOAD CRITICAL',
    drowsy: '> NIGHT CYCLE ACTIVE',
    asleep: '> LOW POWER MODE ENGAGED',
  };

  // Terminal lines 2-3: a scrolling log of New Mombasa status messages.
  var STATUS_LINES = [
    'TRAFFIC GRID NOMINAL',
    'WATER RECLAMATION AT 62%',
    'EVACUATION ROUTE 7 BLOCKED',
    'DATA ARRAY LINK LOST',
    'ODST SQUAD SIGNAL UNRESOLVED',
    'KIKOWANI STATION OFFLINE',
    'STREETLIGHT GRID: SECTOR 9 DARK',
    'SLIPSPACE RUPTURE DETECTED',
    'CIVILIAN HEADCOUNT: UNKNOWN',
    'SEWER PRESSURE NOMINAL',
    'UPLIFT RESERVE CAMERAS OFFLINE',
    'TAYARI PLAZA: ACCESS RESTRICTED',
    'ONI ALPHA SITE: NO RESPONSE',
    'DATA HIVE INTEGRITY AT 41%',
    'BIOMETRIC SCAN QUEUED',
    'ORBITAL ELEVATOR TETHER SEVERED',
    'CURFEW SIRENS TESTED',
    'PUBLIC ADDRESS SYSTEM DEGRADED',
    'BRIDGE TRAFFIC REROUTED',
    'POWER DRAW EXCEEDS FORECAST',
    'LOST PROPERTY: 1 HELMET, ODST',
    'WEATHER: RAIN, CONTINUING',
    'EMERGENCY BROADCAST LOOPING',
    'MEDICAL STATION 14 UNSTAFFED',
    'FIRE SUPPRESSION ACTIVE: NMPD HQ',
    'COVENANT CRUISER OVERHEAD',
    'PARKING ENFORCEMENT SUSPENDED',
    'WATERFRONT HIGHWAY CLOSED',
    'UNREGISTERED ENGINEER DETECTED',
    'SECURITY FOOTAGE ARCHIVED',
    'SIGNAL TRACE: CAPT. DARE',
    'POSTED LIMITS UNOBSERVED',
    'STREET CLEANING POSTPONED',
    'AUDIO LOG 9 OF 30 RECOVERED',
    'DIAGNOSTIC SWEEP COMPLETE',
    'MAGLEV LINE 3 SUSPENDED',
    'SECTOR 4 POWER RESTORED',
    'CITIZEN COMPLAINTS: 4,812 UNREAD',
    'GARBAGE COLLECTION DELAYED',
    'DROP POD IMPACT LOGGED',
    'SUBROUTINE VERGIL: ACTIVE',
    'NMPD DISPATCH: NO UNITS AVAILABLE',
    'MOMBASA QUAYS: DOCKS ABANDONED',
    'KIZINGO BLVD: DEBRIS ON ROADWAY',
    'COASTAL HIGHWAY: TOLLS SUSPENDED',
    'NMPD HQ: DOORS SEALED',
    'DATA HIVE SUBLEVEL 9: FLOODED',
    'SADIE ENDESHA: LOCATION UNKNOWN',
    'POD 6: OCCUPANT UNRESPONSIVE',
    'BANSHEE FLIGHT PATH: LOW ALTITUDE',
    'PHANTOM DROPSHIP SIGHTED',
    'HURAGOK SUSPECTED IN DATA HIVE',
    'SHIELD DOORS: MANUAL OVERRIDE',
    'VEHICLE DEPOT: WARTHOGS MISSING',
    'GAUSS TURRET AMMUNITION LOW',
    'SECTOR 7 SENSORS INTERMITTENT',
    'TRANSIT CARD READERS OFFLINE',
    'HOSPITAL WING B EVACUATED',
    'WATER MAIN BREAK: SECTOR 2',
    'STREET VENDORS ADVISED TO CLOSE',
    'LIBRARY FINES WAIVED: EMERGENCY',
    'AMBIENT MUSIC: NIGHT MODE',
    'STORM DRAINS AT CAPACITY',
    'BRUTE PACK SIGHTED: SECTOR 6',
    'VERGIL DATA FORWARDED TO ONI',
    // Day-to-day city admin, carrying on regardless.
    'POTHOLE REPORTS NOW FILED AS CRATERS',
    'NOISE COMPLAINT: PLASMA FIRE, SECTOR 3',
    'JAYWALKING FINES TEMPORARILY WAIVED',
    'TOURIST INFORMATION CENTRE: CLOSED',
    'TRAFFIC CONES DEPLOYED: 1 (STOLEN)',
    'COFFEE KIOSK 12: SELF-SERVICE ONLY',
    'CITY COUNCIL MEETING POSTPONED AGAIN',
    'LOST CAT REPORTS: 312. CATS FOUND: 1',
    'BUS ROUTE 4 RUNNING EARLY, SOMEHOW',
    'RECYCLING: PLEASE SORT PLASMA SEPARATELY',
    'DOG PARK: DOGS ONLY. NO GRUNTS',
    'PARKING METERS ACCEPTING ANY OFFERING',
    'MUNICIPAL WIFI PASSWORD: STILL "PASSWORD"',
    'BUILDING PERMIT BACKLOG: 6 YEARS',
    'BIKE LANE OBSTRUCTED: WRAITH',
    'NEIGHBOURHOOD WATCH: STILL WATCHING',
    'STREET MUSICIAN LICENCE EXPIRED',
    'FOOD TRUCK FESTIVAL RESCHEDULED',
    'CROSSWALK SIGNAL: WALK. QUICKLY',
    'HYDRANT 88 OPEN. FUN FOR SOME',
    'COMMUNITY GARDEN: GRUNT SIGHTED',
    'TAXI QUEUE: 0 TAXIS, 0 PEOPLE',
    'HAPPY HOUR CANCELLED: SECTOR 5',
    'SPEED CAMERA 9 CLOCKED GHOST AT 140',
    'SCHOOL ZONE LIMITS STILL APPLY',
    'STREET SWEEPER 3 LAST SEEN FLEEING',
    'ICE CREAM VAN: CHIMES DISABLED',
    'LOST AND FOUND: 14 UMBRELLAS, 1 NEEDLER',
    'PIGEON POPULATION: UNBOTHERED',
    'PARKING GARAGE C NOW OPEN-AIR',
    'FARMERS MARKET: TOMATOES SOLD OUT',
    'WRONG-WAY DRIVER REPORTED: PHANTOM',
    'TOWN HALL CLOCK RUNNING 4 MINUTES FAST',
    'GYM MEMBERSHIPS FROZEN UNTIL FURTHER NOTICE',
    'ROAD WORKS AHEAD. AND BEHIND. AND ABOVE',
    'TRAFFIC LIGHT 22 STUCK ON AMBER',
    'PUBLIC TOILETS: OUT OF ORDER (ALL)',
    'MUSEUM EXHIBIT "PEACE" CLOSED EARLY',
    'CINEMA: ALL SHOWINGS POSTPONED',
    'POSTAL SERVICE: PARCELS DELAYED 2 WEEKS',
    'LANDLORD HOTLINE: ESTIMATED WAIT 6 HRS',
    "MAYOR'S OFFICE: OUT TO LUNCH",
    'STREETLIGHT 404: NOT FOUND',
    'SOUVENIR SHOP: SNOW GLOBES 50% OFF',
    'COMPLAINTS HOTLINE: PLEASE STOP CALLING',
    'SPEED BUMP 7 RECLASSIFIED AS RAMP',
    'ESCALATOR 2 IS NOW STAIRS. THANK YOU',
    'PARK BENCHES: 3 OF 40 REMAINING',
    'LOST PROPERTY: JACKAL SHIELD, UNCLAIMED',
    'VENDING MACHINE 9 OWES CITIZEN 2 CREDITS',
  ];

  // Terminal line 4: Claude Code's spinner words, plus a few of Virgil's own.
  var SPINNER_WORDS = [
    'ACCOMPLISHING', 'ACTIONING', 'ACTUALIZING', 'BAKING', 'BOOPING', 'BREWING',
    'CALCULATING', 'CEREBRATING', 'CHANNELING', 'CHURNING', 'CLAUDING', 'COALESCING',
    'COGITATING', 'COMPUTING', 'COMBOBULATING', 'CONCOCTING', 'CONSIDERING',
    'CONTEMPLATING', 'COOKING', 'CRAFTING', 'CREATING', 'CRUNCHING', 'DECIPHERING',
    'DELIBERATING', 'DETERMINING', 'DISCOMBOBULATING', 'DOING', 'EFFECTING',
    'ELUCIDATING', 'ENCHANTING', 'ENVISIONING', 'FINAGLING', 'FLIBBERTIGIBBETING',
    'FORGING', 'FORMING', 'FROLICKING', 'GENERATING', 'GERMINATING', 'HATCHING',
    'HERDING', 'HONKING', 'IDEATING', 'IMAGINING', 'INCUBATING', 'INFERRING',
    'MANIFESTING', 'MARINATING', 'MEANDERING', 'MOSEYING', 'MULLING', 'MUSTERING',
    'NOODLING', 'PERCOLATING', 'PERUSING', 'PHILOSOPHIZING', 'PONTIFICATING',
    'PONDERING', 'PROCESSING', 'PUTTERING', 'PUZZLING', 'RETICULATING', 'RUMINATING',
    'SCHLEPPING', 'SHIMMYING', 'SIMMERING', 'SMOOSHING', 'SPELUNKING', 'SPINNING',
    'STEWING', 'SUSSING', 'SYNTHESIZING', 'THINKING', 'TINKERING', 'TRANSMUTING',
    'UNFURLING', 'UNRAVELING', 'VIBING', 'WANDERING', 'WHIRRING', 'WIBBLING',
    'WORKING', 'WRANGLING',
    'SUPERINTENDING', 'REROUTING TRAFFIC', 'RETICULATING SEWERS', 'DROPPING FEET FIRST',
    'TRACKING THE ROOKIE', 'POLISHING VISR', 'DEFRAGMENTING DATA HIVE',
    'CONSULTING THE ENGINEER', 'RECALIBRATING STREETLIGHTS', 'DODGING DROP PODS',
    'OBEYING POSTED LIMITS', 'BUFFERING SIGNAGE', 'FILING NOISE COMPLAINTS',
    'LOCATING DARE', 'COUNTING RAINDROPS', 'EVACUATING POLITELY', 'HUMMING ELEVATOR MUSIC',
    'SWEEPING SUBWAYS',
  ];
  var ASLEEP_WORD = 'HIBERNATING';

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Design coordinates are traced from the original 2000x1125 artwork.
  // Left-anchored points (L) and right-anchored points (R) share one scale,
  // so on wide screens the lines joining them stretch to fill the width.
  function computeLayout(width, height) {
    var s = Math.min(height / DESIGN_H, width / DESIGN_W);
    var oy = (height - DESIGN_H * s) / 2;
    function L(x, y) { return { x: x * s, y: oy + y * s }; }
    function R(x, y) { return { x: width - (DESIGN_W - x) * s, y: oy + y * s }; }

    var virgilCenter = R(1750, 820);
    var captionPos = R(1752, 1027);

    return {
      width: width,
      height: height,
      scale: s,
      lineWidth: Math.max(1, 2.6 * s),
      lines: [
        [L(181, 41), L(209, 13), L(280, 13), L(347, 78), L(206, 216), L(206, 322)],
        [L(425, 0), L(265, 172), L(265, 460), L(275, 470), L(275, 600), L(265, 610), L(265, 808), L(543, 1110)],
        [L(243, 810), L(481, 1072)],
        [L(480, 1018), L(515, 1053), R(1485, 1053), R(1503, 1035), R(1493, 1025),
          R(1493, 989), R(1427, 989), R(1403, 964), R(1362, 964)],
        [R(1503, 1035), R(1533, 1064), R(1968, 1064)],
        [L(0, 588), L(107, 588), L(113, 582)],
        [L(134, 472), L(134, 750)],
        [L(165, 552), L(370, 552)],
        [L(190, 552), L(207, 535), L(225, 552)],
        [L(66, 862), L(66, 1040)],
      ],
      crosshair: { center: L(134, 553), r: 31 * s },
      wBox: { center: L(134, 463), size: 18 * s },
      tick: { at: L(62, 942), w: 5 * s, h: 26 * s },
      diamond: { center: R(1340, 963), size: 22 * s },
      terminal: { x: 486 * s, y: oy + 59 * s, lineHeight: 61 * s, fontSize: 22 * s },
      virgil: {
        cx: virgilCenter.x,
        cy: virgilCenter.y,
        r: 162 * s,
        faceR: 147 * s,
        eyeR: 44 * s,
        eyeDx: 73 * s,
        eyeDy: -3 * s,
      },
      caption: { x: captionPos.x, y: captionPos.y, fontSize: 22 * s },
    };
  }

  function pickDifferent(list, current, rand) {
    return pickNotIn(list, [current], rand);
  }

  function pickNotIn(list, exclude, rand) {
    var options = list.filter(function (t) { return exclude.indexOf(t) === -1; });
    if (options.length === 0) return list[0];
    return options[Math.floor(rand() * options.length) % options.length];
  }

  function glitchText(text, rand) {
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      out += c !== ' ' && rand() < 0.35
        ? GLITCH_CHARS.charAt(Math.floor(rand() * GLITCH_CHARS.length))
        : c;
    }
    return out;
  }

  // Claude Code's word change: a block cursor sweeps left to right over the old
  // text. The two cells behind it flicker between '.', '_' and the new letter,
  // and the third cell back settles. Text ahead of the cursor is still the old word.
  function sweepText(from, to, step, rand) {
    var width = Math.max(from.length, to.length);
    var out = '';
    for (var d = 0; d < width; d++) {
      var target = to.charAt(d) || ' ';
      var k = step - d;
      if (k < 0) out += from.charAt(d) || ' ';
      else if (target === ' ') out += ' ';
      else if (k === 0) out += '\u258C';
      else if (k < 3) out += ['.', '_', target][Math.floor(rand() * 3) % 3];
      else out += target;
    }
    return out.replace(/\s+$/, '');
  }

  function initialTerminal(rand) {
    var first = pickNotIn(STATUS_LINES, [], rand);
    return {
      log: [first, pickNotIn(STATUS_LINES, [first], rand)],
      outgoing: null,
      word: pickNotIn(SPINNER_WORDS, [], rand),
      changedAt: null,
      nextWordAt: null,
      headerGlitchUntil: 0,
    };
  }

  function isCurfew(date) {
    var h = date.getHours();
    return h >= 23 || h < 6;
  }

  function computeScene(inputs, previousScene) {
    var settings = Object.assign({}, DEFAULT_SETTINGS, inputs.settings || {});
    var rand = inputs.rand || Math.random;
    var date = inputs.date;
    var now = date.getTime();
    var prev = previousScene ? previousScene.state : null;
    var motion = !inputs.onBattery;

    var state = {
      bootAt: prev ? prev.bootAt : now,
      lastNow: now,
      cpuAvg: prev ? prev.cpuAvg : null,
      alarmedUntil: prev ? prev.alarmedUntil : 0,
      caption: prev ? prev.caption : null,
      nextBlinkAt: prev ? prev.nextBlinkAt : now + 3000 + rand() * 4000,
      blinkUntil: prev ? prev.blinkUntil : 0,
      nextExprAt: prev ? prev.nextExprAt : now + 15000 + rand() * 25000,
      expr: prev ? prev.expr : null,
      exprUntil: prev ? prev.exprUntil : 0,
      nextFlickerAt: prev ? prev.nextFlickerAt : now + 8000 + rand() * 12000,
      flickerUntil: prev ? prev.flickerUntil : 0,
      mood: prev ? prev.mood : null,
      term: prev ? prev.term : initialTerminal(rand),
    };

    // Sustained CPU: exponential moving average starting from 0, so a single
    // high sample (or a short spike) can't trip the alarm on its own.
    var cpu = inputs.cpu;
    if (typeof cpu === 'number' && isFinite(cpu)) {
      var dt = prev ? Math.max(0, now - prev.lastNow) : 0;
      var avg = state.cpuAvg == null ? 0 : state.cpuAvg;
      state.cpuAvg = avg + (1 - Math.exp(-dt / CPU_TAU_MS)) * (cpu - avg);
    }
    if (state.cpuAvg != null && state.cpuAvg >= settings.cpuThreshold) {
      state.alarmedUntil = now + ALARM_HOLD_MS;
    }
    var alarmed = now < state.alarmedUntil;

    var mood;
    if (inputs.idleMs >= settings.idleMinutes * 60000) mood = 'asleep';
    else if (alarmed) mood = 'alarmed';
    else if (isCurfew(date)) mood = 'drowsy';
    else mood = 'default';

    // Caption: switch immediately on mood change, otherwise rotate on a timer.
    var list = CAPTIONS[mood];
    var cap = state.caption;
    if (!cap || cap.mood !== mood) {
      cap = {
        mood: mood,
        text: pickDifferent(list, cap ? cap.text : null, rand),
        nextChangeAt: now + CAPTION_MIN_MS + rand() * CAPTION_JITTER_MS,
        transitionUntil: cap ? now + GLITCH_MS : 0,
      };
    } else if (now >= cap.nextChangeAt) {
      cap = {
        mood: mood,
        text: pickDifferent(list, cap.text, rand),
        nextChangeAt: now + CAPTION_MIN_MS + rand() * CAPTION_JITTER_MS,
        transitionUntil: list.length > 1 ? now + GLITCH_MS : 0,
      };
    }
    state.caption = cap;
    var glitching = motion && now < cap.transitionUntil;

    // Expression events (blinks, glances, winks) only run while animating.
    if (motion) {
      if (now >= state.nextBlinkAt) {
        state.blinkUntil = now + 150;
        state.nextBlinkAt = now + 3000 + rand() * 4000;
      }
      if (now >= state.nextExprAt) {
        var exprs = ['happy', 'wink', 'lidded'];
        state.expr = exprs[Math.floor(rand() * exprs.length) % exprs.length];
        state.exprUntil = now + 2000 + rand() * 2000;
        state.nextExprAt = now + 15000 + rand() * 25000;
      }
      if (now >= state.nextFlickerAt) {
        state.flickerUntil = now + 350;
        state.nextFlickerAt = now + 8000 + rand() * 12000;
      }
    }
    var blinking = motion && now < state.blinkUntil;
    var exprActive = motion && now < state.exprUntil;

    var eyes;
    if (mood === 'asleep') eyes = { left: 'closed', right: 'closed' };
    else if (mood === 'alarmed') eyes = { left: 'angry', right: 'angry' };
    else if (mood === 'drowsy') eyes = { left: 'lidded', right: 'lidded' };
    else if (exprActive && state.expr === 'wink') eyes = { left: 'open', right: 'lidded' };
    else if (exprActive) eyes = { left: state.expr, right: state.expr };
    else eyes = { left: 'open', right: 'open' };
    if (blinking && mood !== 'asleep') eyes = { left: 'closed', right: 'closed' };

    var layout = computeLayout(inputs.width, inputs.height);
    var v = layout.virgil;

    var eyeTracking = motion && mood !== 'asleep' && !!inputs.cursor;
    var eyeOffset = { x: 0, y: 0 };
    if (eyeTracking) {
      var dx = inputs.cursor.x - v.cx;
      var dy = inputs.cursor.y - v.cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        var mag = Math.min(v.faceR * 0.12, dist * 0.04);
        eyeOffset = { x: (dx / dist) * mag, y: (dy / dist) * mag };
      }
    }

    // Terminal: mood header, a two-line status log, and a spinner word. Each
    // time the word changes, a new status line types in and the log scrolls up.
    var term = Object.assign({}, state.term);
    if (prev && prev.mood !== mood) term.headerGlitchUntil = now + GLITCH_MS;
    if (prev && prev.mood === 'asleep' && mood !== 'asleep') term.nextWordAt = now;
    state.mood = mood;

    var header = HEADERS[mood];
    var bootLines = [header, '> ' + term.log[0], '> ' + term.log[1], '> ' + term.word];
    var bootChars = bootLines.join('').length;
    var booting = motion && (now - state.bootAt) / TYPE_MS_PER_CHAR < bootChars;

    if (booting || mood === 'asleep' || term.nextWordAt == null) {
      term.nextWordAt = now + SPINNER_MIN_MS + rand() * SPINNER_JITTER_MS;
    } else if (now >= term.nextWordAt) {
      term.outgoing = term.log[0];
      term.log = [term.log[1], pickNotIn(STATUS_LINES, term.log, rand)];
      term.word = pickDifferent(SPINNER_WORDS, term.word, rand);
      term.changedAt = now;
      term.nextWordAt = now + SPINNER_MIN_MS + rand() * SPINNER_JITTER_MS;
    }

    var word = mood === 'asleep' ? ASLEEP_WORD : term.word;
    if (term.shownWord == null) term.shownWord = word;
    if (word !== term.shownWord) {
      term.fromWord = term.shownWord;
      term.shownWord = word;
      term.sweepAt = now;
    }
    state.term = term;

    var dotCount = motion ? 1 + (Math.floor(now / (mood === 'asleep' ? 1000 : 400)) % 3) : 3;
    var dots = '...'.slice(0, dotCount);
    var headerShown = motion && now < term.headerGlitchUntil ? glitchText(header, rand) : header;
    var lines;
    var typing = false;
    var scroll = null;

    if (booting) {
      typing = true;
      var budget = Math.floor((now - state.bootAt) / TYPE_MS_PER_CHAR);
      lines = [];
      for (var i = 0; i < bootLines.length && budget > 0; i++) {
        lines.push(bootLines[i].slice(0, budget));
        budget -= bootLines[i].length;
      }
      if (lines.length === bootLines.length && budget >= 0) lines[3] += dots;
    } else {
      var newLine = '> ' + term.log[1];
      var wordLine = '> ' + word + dots;
      if (motion && mood !== 'asleep' && term.changedAt != null) {
        // The "> " prompt stays put; only the text after it types out.
        var since = now - term.changedAt;
        var shown = Math.floor(since / TYPE_MS_PER_CHAR);
        typing = shown < term.log[1].length;
        newLine = '> ' + term.log[1].slice(0, shown);
        if (since < SCROLL_MS) {
          scroll = { progress: since / SCROLL_MS, outgoing: '> ' + term.outgoing };
        }
      }
      if (motion && term.sweepAt != null) {
        var from = term.fromWord + '...';
        var to = word + '...';
        var step = Math.floor((now - term.sweepAt) / SWEEP_MS_PER_CHAR);
        if (step - 3 < Math.max(from.length, to.length)) {
          typing = true;
          wordLine = '> ' + sweepText(from, to, step, rand);
        }
      }
      lines = [headerShown, '> ' + term.log[0], newLine, wordLine];
    }

    var flicker = motion && now < state.flickerUntil;
    var updateIntervalMs = motion
      ? FRAME_MS
      : 60000 - (date.getSeconds() * 1000 + date.getMilliseconds());

    return {
      mood: mood,
      state: state,
      layout: layout,
      face: {
        color: mood === 'alarmed' ? ALARM_FACE : settings.faceColor,
        rimColor: RIM_COLOR,
        eyes: eyes,
        eyeOffset: eyeOffset,
        scale: motion && mood === 'asleep' ? 1 + 0.015 * Math.sin((2 * Math.PI * now) / 4000) : 1,
      },
      caption: {
        text: cap.text,
        display: '>> ' + (glitching ? glitchText(cap.text, rand) : cap.text) + ' <<',
        color: mood === 'alarmed' ? ALARM_TEXT : TEXT_COLOR,
        glitching: glitching,
      },
      terminal: { lines: lines, color: TEXT_COLOR, scroll: scroll },
      frameAlpha: flicker ? 0.35 + rand() * 0.5 : 1,
      effects: {
        motion: motion,
        flicker: flicker,
        typing: typing,
        eyeTracking: eyeTracking,
      },
      updateIntervalMs: Math.max(1000 / 30, updateIntervalMs),
    };
  }

  var api = {
    computeScene: computeScene,
    computeLayout: computeLayout,
    mulberry32: mulberry32,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    CAPTIONS: CAPTIONS,
    HEADERS: HEADERS,
    STATUS_LINES: STATUS_LINES,
    SPINNER_WORDS: SPINNER_WORDS,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VirgilScene = api;
})(typeof window !== 'undefined' ? window : globalThis);

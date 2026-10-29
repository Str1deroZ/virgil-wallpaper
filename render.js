// Draws a scene from computeScene. Holds no behavioural rules.
(function (root) {
  'use strict';

  var LINE_COLOR = '#d9d9d9';
  var FONT = 'bold {size}px Calibri, "Segoe UI", Arial, sans-serif';

  function font(size) { return FONT.replace('{size}', size.toFixed(1)); }

  function drawFrame(ctx, layout, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = layout.lineWidth;
    ctx.lineJoin = 'miter';

    layout.lines.forEach(function (pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    });

    var c = layout.crosshair;
    ctx.beginPath();
    ctx.arc(c.center.x, c.center.y, c.r, 0, Math.PI * 2);
    ctx.stroke();

    var wb = layout.wBox;
    ctx.lineWidth = layout.lineWidth * 0.6;
    ctx.strokeRect(wb.center.x - wb.size / 2, wb.center.y - wb.size / 2, wb.size, wb.size);
    ctx.fillStyle = LINE_COLOR;
    ctx.font = font(wb.size * 0.75);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('W', wb.center.x, wb.center.y + wb.size * 0.05);

    var t = layout.tick;
    ctx.fillRect(t.at.x, t.at.y, t.w, t.h);

    var d = layout.diamond;
    ctx.beginPath();
    ctx.moveTo(d.center.x, d.center.y - d.size);
    ctx.lineTo(d.center.x + d.size, d.center.y);
    ctx.lineTo(d.center.x, d.center.y + d.size);
    ctx.lineTo(d.center.x - d.size, d.center.y);
    ctx.closePath();
    ctx.fillStyle = '#3a3a3a';
    ctx.fill();
    ctx.lineWidth = layout.lineWidth;
    ctx.strokeStyle = '#555';
    ctx.stroke();
    ctx.restore();
  }

  function drawTerminal(ctx, scene) {
    var t = scene.layout.terminal;
    ctx.save();
    ctx.fillStyle = scene.terminal.color;
    ctx.font = font(t.fontSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    var scroll = scene.terminal.scroll;
    scene.terminal.lines.forEach(function (line, i) {
      // While scrolling, line 2 slides up from line 3's slot.
      var lift = scroll && i === 1 ? (1 - scroll.progress) * t.lineHeight : 0;
      ctx.fillText(line, t.x, t.y + i * t.lineHeight + lift);
    });
    if (scroll) {
      // The outgoing log line drifts up and fades out.
      ctx.globalAlpha = 1 - scroll.progress;
      ctx.fillText(scroll.outgoing, t.x, t.y + (1 - scroll.progress * 0.5) * t.lineHeight);
    }
    ctx.restore();
  }

  function drawEye(ctx, shape, x, y, r, mirror) {
    ctx.beginPath();
    switch (shape) {
      case 'closed':
        ctx.rect(x - r, y - r * 0.09, r * 2, r * 0.18);
        break;
      case 'lidded': // flat top, lower half visible
        ctx.arc(x, y, r, 0, Math.PI);
        ctx.closePath();
        break;
      case 'happy': // flat bottom, upper half visible
        ctx.arc(x, y, r, Math.PI, Math.PI * 2);
        ctx.closePath();
        break;
      case 'angry': {
        ctx.save();
        // Keep the part of the eye below a brow that slopes down toward the nose.
        var s = mirror ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(x - s * r * 1.2, y - r * 0.95);
        ctx.lineTo(x + s * r * 1.2, y + r * 0.15);
        ctx.lineTo(x + s * r * 1.2, y + r * 1.2);
        ctx.lineTo(x - s * r * 1.2, y + r * 1.2);
        ctx.closePath();
        ctx.clip();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }
      default:
        ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  function drawVirgil(ctx, scene) {
    var v = scene.layout.virgil;
    var f = scene.face;
    ctx.save();
    ctx.translate(v.cx, v.cy);
    ctx.scale(f.scale, f.scale);

    ctx.fillStyle = f.rimColor;
    ctx.beginPath();
    ctx.arc(0, 0, v.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(0, 0, v.faceR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = f.rimColor;
    var ox = f.eyeOffset.x;
    var oy = f.eyeOffset.y;
    drawEye(ctx, f.eyes.left, -v.eyeDx + ox, v.eyeDy + oy, v.eyeR, false);
    drawEye(ctx, f.eyes.right, v.eyeDx + ox, v.eyeDy + oy, v.eyeR, true);
    ctx.restore();

    var c = scene.layout.caption;
    ctx.save();
    ctx.fillStyle = scene.caption.color;
    ctx.font = font(c.fontSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var jitter = scene.caption.glitching ? (Math.random() - 0.5) * c.fontSize * 0.3 : 0;
    ctx.fillText(scene.caption.display, c.x + jitter, c.y);
    ctx.restore();
  }

  function render(ctx, scene, now, dpr) {
    var w = scene.layout.width;
    var h = scene.layout.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    drawFrame(ctx, scene.layout, scene.frameAlpha);
    drawTerminal(ctx, scene);
    drawVirgil(ctx, scene);
  }

  root.VirgilRender = { render: render };
})(window);

// ── SNAKE.scene — 水墨画风 Three.js 渲染 ──────────
SNAKE.scene = {};

(function(sc) {
// ═══════════════════════════════════════════════════════
// Three.js setup
// ═══════════════════════════════════════════════════════
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xF5F0E8);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0xF5F0E8);
scene.fog = new THREE.Fog(0xF5F0E8, 25, 70);
var camera = new THREE.PerspectiveCamera(52, 1, 0.3, 120);

sc.renderer = renderer;
sc.scene = scene;
sc.camera = camera;

// ═══════════════════════════════════════════════════════
// Canvas texture helpers
// ═══════════════════════════════════════════════════════
function _createCanvas(w, h, drawFn) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    return c;
}

function _canvasTex(w, h, drawFn) {
    var canvas = _createCanvas(w, h, drawFn);
    var tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
}

// Paper grain: subtle noise for organic feel
function _paperGrainTex() {
    return _canvasTex(256, 256, function(ctx, w, h) {
        var imageData = ctx.createImageData(w, h);
        for (var i = 0; i < imageData.data.length; i += 4) {
            var v = 245 + Math.random() * 10;
            imageData.data[i] = v;
            imageData.data[i+1] = v;
            imageData.data[i+2] = v;
            imageData.data[i+3] = 18;
        }
        ctx.putImageData(imageData, 0, 0);
    });
}

// Vertical gradient: stops = [[yFrac, r, g, b], ...]
function _gradientTex(stops) {
    return _canvasTex(4, 256, function(ctx, w, h) {
        var grad = ctx.createLinearGradient(0, 0, 0, h);
        stops.forEach(function(s) {
            grad.addColorStop(s[0], 'rgb(' + s[1] + ',' + s[2] + ',' + s[3] + ')');
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    });
}

// Mountain texture with brush strokes (皴法)
function _mountainTex(baseR, baseG, baseB, peakAlpha, baseAlpha) {
    return _canvasTex(256, 180, function(ctx, w, h) {
        // Gradient from peak (darker, more opaque) to base (lighter, more transparent)
        var grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(' + baseR + ',' + baseG + ',' + baseB + ',' + peakAlpha + ')');
        grad.addColorStop(0.5, 'rgba(' + Math.min(255, baseR+40) + ',' + Math.min(255, baseG+40) + ',' + Math.min(255, baseB+40) + ',' + (peakAlpha*0.5) + ')');
        grad.addColorStop(1, 'rgba(240,235,225,' + baseAlpha + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Brush strokes (皴法 lines)
        ctx.strokeStyle = 'rgba(26, 24, 21, 0.25)';
        ctx.lineWidth = 1.2;
        for (var i = 0; i < 5; i++) {
            ctx.beginPath();
            var sx = 20 + Math.random() * 200;
            var sy = 15 + i * 30 + Math.random() * 20;
            ctx.moveTo(sx, sy);
            // Irregular stroke path
            var cx1 = sx + (Math.random() - 0.5) * 80;
            var cy1 = sy + 15 + Math.random() * 25;
            var cx2 = sx + (Math.random() - 0.5) * 60;
            var cy2 = sy + 25 + Math.random() * 35;
            var ex = sx + (Math.random() - 0.3) * 100;
            var ey = sy + 35 + Math.random() * 45;
            ctx.bezierCurveTo(cx1, cy1, cx2, cy2, ex, ey);
            ctx.stroke();
        }
        // Lighter strokes
        ctx.strokeStyle = 'rgba(60, 55, 45, 0.12)';
        ctx.lineWidth = 0.8;
        for (var j = 0; j < 7; j++) {
            ctx.beginPath();
            var sx2 = 30 + Math.random() * 180;
            var sy2 = 10 + j * 22 + Math.random() * 15;
            ctx.moveTo(sx2, sy2);
            ctx.quadraticCurveTo(sx2 + (Math.random()-0.5)*70, sy2 + 20, sx2 + (Math.random()-0.5)*90, sy2 + 40);
            ctx.stroke();
        }
    });
}

// Water radial fade texture
function _waterTex() {
    return _canvasTex(512, 512, function(ctx, w, h) {
        var cx = w/2, cy = h/2;
        var grad = ctx.createRadialGradient(cx, cy, w*0.35, cx, cy, w*0.7);
        grad.addColorStop(0, 'rgba(40, 36, 30, 0.22)');
        grad.addColorStop(0.5, 'rgba(40, 36, 30, 0.10)');
        grad.addColorStop(1, 'rgba(40, 36, 30, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    });
}

// Water ripple rings (dynamic)
function _waterRippleTex(time) {
    return _canvasTex(512, 512, function(ctx, w, h) {
        var cx = w/2, cy = h/2;
        // Base radial fade
        var grad = ctx.createRadialGradient(cx, cy, w*0.35, cx, cy, w*0.7);
        grad.addColorStop(0, 'rgba(40, 36, 30, 0.22)');
        grad.addColorStop(0.5, 'rgba(40, 36, 30, 0.10)');
        grad.addColorStop(1, 'rgba(40, 36, 30, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Concentric ripple rings
        ctx.strokeStyle = 'rgba(50, 45, 35, 0.06)';
        ctx.lineWidth = 0.8;
        for (var r = 0; r < 6; r++) {
            var radius = 60 + r * 40 + Math.sin(time * 0.7 + r) * 12;
            var alpha = 0.07 - r * 0.011;
            if (alpha <= 0) continue;
            ctx.strokeStyle = 'rgba(50, 45, 35, ' + alpha + ')';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

// Seal stamp texture with character
function _sealTex(char, baseColor) {
    return _canvasTex(128, 128, function(ctx, w, h) {
        // Aged paper background
        ctx.fillStyle = baseColor || '#CC4444';
        ctx.fillRect(0, 0, w, h);
        // Noise for aged look
        var imageData = ctx.getImageData(0, 0, w, h);
        for (var i = 0; i < imageData.data.length; i += 4) {
            var noise = (Math.random() - 0.5) * 20;
            imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + noise));
            imageData.data[i+1] = Math.min(255, Math.max(0, imageData.data[i+1] + noise));
            imageData.data[i+2] = Math.min(255, Math.max(0, imageData.data[i+2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);
        // Character
        ctx.fillStyle = 'rgba(255,220,200,0.9)';
        ctx.font = 'bold 56px "KaiTi", "楷体", "STKaiti", "SimSun", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, w/2, h/2);
        // Subtle border
        ctx.strokeStyle = 'rgba(180,80,50,0.7)';
        ctx.lineWidth = 3;
        ctx.strokeRect(6, 6, w-12, h-12);
    });
}

// Cloud texture
function _cloudTex() {
    return _canvasTex(128, 64, function(ctx, w, h) {
        var cx = w/2, cy = h/2;
        var grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, w*0.55);
        grad.addColorStop(0, 'rgba(230,225,215,0.35)');
        grad.addColorStop(0.4, 'rgba(220,215,205,0.18)');
        grad.addColorStop(0.7, 'rgba(210,205,195,0.05)');
        grad.addColorStop(1, 'rgba(200,195,185,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    });
}

// ═══════════════════════════════════════════════════════
// Sky background plane (S3.4)
// ═══════════════════════════════════════════════════════
var skyTex = _gradientTex([
    [0,   208, 204, 196],  // top: light grey
    [0.2, 220, 216, 208],
    [0.5, 240, 235, 225],
    [0.7, 248, 245, 238],
    [0.9, 251, 250, 246],
    [1,   252, 251, 248]   // bottom: near white
]);
var skyPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 60),
    new THREE.MeshBasicMaterial({ map: skyTex, transparent: true, opacity: 0.9, depthWrite: false })
);
skyPlane.position.set(0, 8, -35);
scene.add(skyPlane);

// ═══════════════════════════════════════════════════════
// Water mirror (S1.2)
// ═══════════════════════════════════════════════════════
var waterTex0 = _waterTex();
var waterPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshBasicMaterial({ map: waterTex0, transparent: true, opacity: 0.85, depthWrite: false })
);
waterPlane.rotation.x = -Math.PI / 2;
waterPlane.position.y = -5.7;
waterPlane.renderOrder = 1;
scene.add(waterPlane);
sc.waterPlane = waterPlane;

// ═══════════════════════════════════════════════════════
// Mountains (4 layers) with gradient + brush strokes (S3.1)
// ═══════════════════════════════════════════════════════
var mountainGroup = new THREE.Group();
scene.add(mountainGroup);
sc.mountainGroup = mountainGroup;

var mountainDefs = [
    { z: -20, w: 28, h: 9, y: -1.5, peakA: 0.55, baseA: 0.05, r: 35, g: 30, b: 25 },
    { z: -24, w: 32, h: 10, y: -1.0, peakA: 0.40, baseA: 0.04, r: 55, g: 48, b: 40 },
    { z: -28, w: 36, h: 8, y: -0.5, peakA: 0.28, baseA: 0.03, r: 80, g: 72, b: 62 },
    { z: -32, w: 40, h: 7, y: 0,    peakA: 0.15, baseA: 0.02, r: 120, g: 112, b: 100 }
];

mountainDefs.forEach(function(def) {
    var tex = _mountainTex(def.r, def.g, def.b, def.peakA, def.baseA);
    var mt = new THREE.Mesh(
        new THREE.PlaneGeometry(def.w, def.h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide })
    );
    mt.position.set(0, def.y, def.z);
    mt.renderOrder = 2;
    mountainGroup.add(mt);

    // Second peak offset for variety
    if (def.z > -30) {
        var mt2 = new THREE.Mesh(
            new THREE.PlaneGeometry(def.w * 0.65, def.h * 0.8),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })
        );
        mt2.position.set(def.w * 0.25, def.y - 0.8, def.z - 1.5);
        mt2.renderOrder = 2;
        mountainGroup.add(mt2);
    }
});

// ═══════════════════════════════════════════════════════
// World elements: boat, pavilion, bamboo (S3.3)
// ═══════════════════════════════════════════════════════
// Boat
var boatShape = new THREE.Shape();
boatShape.moveTo(-0.8, 0);
boatShape.quadraticCurveTo(-0.6, -0.15, -0.15, -0.2);
boatShape.quadraticCurveTo(0.3, -0.2, 0.75, -0.05);
boatShape.quadraticCurveTo(0.3, 0.05, -0.15, 0.05);
boatShape.quadraticCurveTo(-0.6, 0.05, -0.8, 0);
var boatGeo = new THREE.ShapeGeometry(boatShape);
var boat = new THREE.Mesh(
    boatGeo,
    new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide })
);
boat.position.set(8, -5.4, -20);
boat.scale.setScalar(0.7);
boat.renderOrder = 3;
scene.add(boat);

// Pavilion
var pavilionGroup = new THREE.Group();
var pavilionBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.15, 1.2),
    new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: 0.4, depthWrite: false })
);
pavilionBase.position.y = 0.6;
pavilionGroup.add(pavilionBase);

// Pavilion roof (cone)
var roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.0, 0.7, 4),
    new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: 0.5, depthWrite: false })
);
roof.position.y = 1.05;
roof.rotation.y = Math.PI / 4;
pavilionGroup.add(roof);

// Pavilion columns
for (var pc = 0; pc < 4; pc++) {
    var angle = pc * Math.PI / 2 + Math.PI / 4;
    var col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6),
        new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: 0.35, depthWrite: false })
    );
    col.position.set(Math.cos(angle) * 0.45, 0.3, Math.sin(angle) * 0.45);
    pavilionGroup.add(col);
}
pavilionGroup.position.set(-7, -4.9, -25);
pavilionGroup.scale.setScalar(0.8);
pavilionGroup.renderOrder = 3;
scene.add(pavilionGroup);

// Bamboo grove
var bambooGroup = new THREE.Group();
for (var b = 0; b < 5; b++) {
    var bH = 2.5 + Math.random() * 2;
    var bamboo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, bH, 6),
        new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: 0.2, depthWrite: false })
    );
    bamboo.position.set(
        (Math.random() - 0.5) * 0.8,
        bH / 2 - 5.2,
        (Math.random() - 0.5) * 0.6
    );
    bamboo.rotation.z = (Math.random() - 0.5) * 0.15;
    bamboo.rotation.x = (Math.random() - 0.5) * 0.15;
    bambooGroup.add(bamboo);
}
bambooGroup.position.set(9, 0, -18);
bambooGroup.renderOrder = 3;
scene.add(bambooGroup);

// ═══════════════════════════════════════════════════════
// Clouds
// ═══════════════════════════════════════════════════════
var cloudGroup = new THREE.Group();
scene.add(cloudGroup);
var cloudTex = _cloudTex();
var cloudData = [];
for (var ci = 0; ci < 8; ci++) {
    var cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(5 + Math.random() * 8, 2.5 + Math.random() * 4),
        new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.25 + Math.random() * 0.25, depthWrite: false })
    );
    cloud.position.set(
        (Math.random() - 0.5) * 35,
        4 + Math.random() * 7,
        -15 - Math.random() * 20
    );
    cloud.renderOrder = 1;
    cloudGroup.add(cloud);
    cloudData.push({ mesh: cloud, speed: 0.015 + Math.random() * 0.04, baseX: cloud.position.x });
}
sc.cloudData = cloudData;

// ═══════════════════════════════════════════════════════
// Ink mote particles (ambient floating ink dots)
// ═══════════════════════════════════════════════════════
var particlesGroup = new THREE.Group(); scene.add(particlesGroup);
var particleData = [];
for (var pi = 0; pi < 45; pi++) {
    var sz = 0.02 + Math.random() * 0.06;
    var alpha = 0.08 + Math.random() * 0.18;
    var dot = new THREE.Mesh(
        new THREE.SphereGeometry(sz, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: alpha, depthWrite: false })
    );
    dot.position.set((Math.random() - 0.5) * 30, Math.random() * 7 - 3, (Math.random() - 0.5) * 30);
    particlesGroup.add(dot);
    particleData.push({ mesh: dot, baseY: dot.position.y, speed: 0.15 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2, amplitude: 0.15 + Math.random() * 0.5 });
}
sc.particleData = particleData;

// ═══════════════════════════════════════════════════════
// Lighting: warm natural light
// ═══════════════════════════════════════════════════════
scene.add(new THREE.AmbientLight(0xE8E0D5, 1.2));

var keyLight = new THREE.DirectionalLight(0xEEE8DD, 1.4);
keyLight.position.set(10, 22, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 60;
keyLight.shadow.camera.left = -18; keyLight.shadow.camera.right = 18;
keyLight.shadow.camera.top = 18; keyLight.shadow.camera.bottom = -18;
keyLight.shadow.bias = -0.00015;
scene.add(keyLight);

var fillLight = new THREE.DirectionalLight(0xDDD8CC, 0.5);
fillLight.position.set(-5, 8, -3);
scene.add(fillLight);

sc.keyLight = keyLight;

// ═══════════════════════════════════════════════════════
// Pillar group (empty, compat)
// ═══════════════════════════════════════════════════════
sc.pillarGroup = new THREE.Group();
scene.add(sc.pillarGroup);

// ═══════════════════════════════════════════════════════
// Snake: single TubeGeometry with ink aesthetics (S2)
// ═══════════════════════════════════════════════════════
var snakeMeshes = [];
var snakeTube = null;
var inkBleed = null;
var reflectionTube = null;
sc.snakeMeshes = snakeMeshes;
sc.snakeTube = snakeTube;
sc.inkBleed = inkBleed;
sc.reflectionTube = reflectionTube;

// Head dot (起笔点)
var headDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 12),
    new THREE.MeshPhongMaterial({ color: 0x0a0805, specular: 0x111111, shininess: 15 })
);
headDot.visible = false;
scene.add(headDot);
sc.headDot = headDot;

// Head glow (warm subtle)
var headGlow = new THREE.PointLight(0xDDD5C0, 1.8, 3.5);
headGlow.visible = false;
scene.add(headGlow);
sc.headGlow = headGlow;

// Tail motes (飞白 particles)
var tailMotes = [];
var MAX_TAIL_MOTES = 20;
for (var tmi = 0; tmi < MAX_TAIL_MOTES; tmi++) {
    var mote = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 3, 3),
        new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: 0, depthWrite: false })
    );
    mote.visible = false;
    scene.add(mote);
    tailMotes.push({ mesh: mote, life: 0, pos: new THREE.Vector3() });
}
sc.tailMotes = tailMotes;

// Helper: create or rebuild a TubeGeometry along given curve
function _makeTube(curve, radiusFn, material) {
    // Build custom tube geometry with variable radius
    var tubularSegments = 50;
    var radialSegments = 8;
    var closed = false;

    var frames = curve.computeFrenetFrames(tubularSegments, closed);
    var vertices = [];
    var normals = [];
    var uvs = [];
    var indices = [];

    var i, j;

    for (i = 0; i <= tubularSegments; i++) {
        var t = i / tubularSegments;
        var P = curve.getPointAt(t);
        var N = frames.normals[i];
        var B = frames.binormals[i];
        var r = typeof radiusFn === 'function' ? radiusFn(t) : (radiusFn || 0.22);

        for (j = 0; j <= radialSegments; j++) {
            var v = j / radialSegments * Math.PI * 2;
            var sin = Math.sin(v);
            var cos = -Math.cos(v);

            var nx = cos * N.x + sin * B.x;
            var ny = cos * N.y + sin * B.y;
            var nz = cos * N.z + sin * B.z;

            vertices.push(P.x + r * nx, P.y + r * ny, P.z + r * nz);
            normals.push(nx, ny, nz);
            uvs.push(t, j / radialSegments);
        }
    }

    for (i = 0; i < tubularSegments; i++) {
        for (j = 0; j < radialSegments; j++) {
            var a = i * (radialSegments + 1) + j;
            var b = a + radialSegments + 1;
            var c = a + 1;
            var d = b + 1;
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);

    return new THREE.Mesh(geo, material);
}

function _tubeRadius(t) {
    // Taper: head 0.30 → tail 0.08
    return 0.30 - t * 0.22;
}

function _bleedRadius(t) {
    // Ink bleed: wider and more diffuse
    return _tubeRadius(t) * 1.55;
}

function _reflectRadius(t) {
    return _tubeRadius(t) * 1.0;
}

sc.rebuildSnakeMeshes = function(snake) {
    var gs = SNAKE.CONST.GRID_SIZE;
    var points = [];
    for (var i = 0; i < snake.length; i++) {
        var wp = SNAKE.gridToWorld(snake[i].x, snake[i].y);
        points.push(new THREE.Vector3(wp.x, -4.5, wp.z));
    }

    // Dispose old tubes
    if (snakeTube) { snakeTube.geometry.dispose(); scene.remove(snakeTube); }
    if (inkBleed) { inkBleed.geometry.dispose(); scene.remove(inkBleed); }
    if (reflectionTube) { reflectionTube.geometry.dispose(); scene.remove(reflectionTube); }

    if (points.length < 2) {
        headDot.visible = false;
        headGlow.visible = false;
        // Clear snakeMeshes compat array
        snakeMeshes.length = 0;
        return;
    }

    // Extend endpoints slightly for smooth curve
    var first = points[0], last = points[points.length-1];
    var second = points.length > 1 ? points[1] : first;
    var secondLast = points.length > 1 ? points[points.length-2] : last;
    var extFirst = new THREE.Vector3().copy(first).add(
        new THREE.Vector3().copy(first).sub(second).normalize().multiplyScalar(0.5));
    var extLast = new THREE.Vector3().copy(last).add(
        new THREE.Vector3().copy(last).sub(secondLast).normalize().multiplyScalar(0.5));
    var curvePoints = [extFirst].concat(points).concat([extLast]);

    var curve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5);

    // Main tube: ink body
    var inkMat = new THREE.MeshPhongMaterial({
        color: 0x1a1815,
        specular: 0x111111,
        shininess: 8,
        flatShading: false
    });
    snakeTube = _makeTube(curve, _tubeRadius, inkMat);
    snakeTube.castShadow = true;
    snakeTube.receiveShadow = true;
    scene.add(snakeTube);

    // Ink bleed: diffuse halo
    var bleedMat = new THREE.MeshBasicMaterial({
        color: 0x1a1815,
        transparent: true,
        opacity: 0.06,
        depthWrite: false
    });
    inkBleed = _makeTube(curve, _bleedRadius, bleedMat);
    scene.add(inkBleed);

    // Water reflection: Y-flipped snake with low opacity
    var reflMat = new THREE.MeshBasicMaterial({
        color: 0x1a1815,
        transparent: true,
        opacity: 0.07,
        depthWrite: false
    });
    var reflPoints = points.map(function(p) {
        return new THREE.Vector3(p.x, -6.3, p.z);
    });
    var reflFirst = reflPoints[0], reflLast = reflPoints[reflPoints.length-1];
    var reflSecond = reflPoints.length > 1 ? reflPoints[1] : reflFirst;
    var reflSecondLast = reflPoints.length > 1 ? reflPoints[reflPoints.length-2] : reflLast;
    var reflExtFirst = new THREE.Vector3().copy(reflFirst).add(
        new THREE.Vector3().copy(reflFirst).sub(reflSecond).normalize().multiplyScalar(0.5));
    var reflExtLast = new THREE.Vector3().copy(reflLast).add(
        new THREE.Vector3().copy(reflLast).sub(reflSecondLast).normalize().multiplyScalar(0.5));
    var reflCurve = new THREE.CatmullRomCurve3(
        [reflExtFirst].concat(reflPoints).concat([reflExtLast]),
        false, 'catmullrom', 0.5);
    reflectionTube = _makeTube(reflCurve, _reflectRadius, reflMat);
    reflectionTube.renderOrder = 0;
    scene.add(reflectionTube);

    // Update head dot & glow
    headDot.visible = true;
    headDot.position.copy(points[0]);
    headGlow.visible = true;
    headGlow.position.copy(points[0]);
    headGlow.position.y += 0.1;

    // Build snakeMeshes compat array (for game.js interpolation)
    // Create positional Object3Ds along the curve
    var segCount = Math.max(1, points.length);
    // Reuse / trim snakeMeshes
    while (snakeMeshes.length < segCount) {
        var group = new THREE.Object3D();
        group.userData = { targetX: 0, targetZ: 0, prevX: 0, prevZ: 0, baseScale: 1 };
        scene.add(group);
        snakeMeshes.push({ group: group });
    }
    for (var k = 0; k < snakeMeshes.length; k++) {
        snakeMeshes[k].group.visible = k < segCount;
    }

    for (var si = 0; si < segCount; si++) {
        var seg = snakeMeshes[si];
        var pt = points[si];
        var t = si / Math.max(1, segCount - 1);
        var thickness = 1 - t * 0.5;
        seg.group.userData.targetX = pt.x;
        seg.group.userData.targetZ = pt.z;
        seg.group.userData.baseScale = thickness;
        seg.group.position.set(pt.x, -4.5, pt.z);
        seg.group.scale.setScalar(thickness);
    }

    sc.snakeTube = snakeTube;
    sc.inkBleed = inkBleed;
    sc.reflectionTube = reflectionTube;

    // Spawn tail motes at last position
    if (points.length > 0) {
        var tailPos = points[points.length - 1];
        _spawnTailMote(tailPos);
    }
};

function _spawnTailMote(pos) {
    for (var i = 0; i < tailMotes.length; i++) {
        var tm = tailMotes[i];
        if (tm.life <= 0) {
            tm.mesh.position.copy(pos);
            tm.mesh.position.x += (Math.random() - 0.5) * 0.3;
            tm.mesh.position.z += (Math.random() - 0.5) * 0.3;
            tm.mesh.position.y += (Math.random() - 0.5) * 0.15;
            tm.life = 0.5 + Math.random() * 0.4;
            tm.mesh.visible = true;
            tm.mesh.material.opacity = 0.18 + Math.random() * 0.12;
            tm.mesh.scale.setScalar(0.3 + Math.random() * 0.6);
            return;
        }
    }
}

sc.updateSnakeTargets = function(snake, direction) {};
sc.storePrevPositions = function() {
    for (var i = 0; i < snakeMeshes.length; i++) {
        var ud = snakeMeshes[i].group.userData;
        ud.prevX = snakeMeshes[i].group.position.x;
        ud.prevZ = snakeMeshes[i].group.position.z;
    }
};

// ═══════════════════════════════════════════════════════
// Food: cinnabar seal stamp (S4.1)
// ═══════════════════════════════════════════════════════
var foodGroup = new THREE.Group(); scene.add(foodGroup);
var foodGlow = new THREE.PointLight(0xEECC99, 2.2, 4); foodGlow.position.y = 0.3; foodGroup.add(foodGlow);

var sealTexFood = _sealTex('食', '#CC4444');
var sealTexBonus = _sealTex('莲', '#CC8833');

// Seal body: flat cylinder
var sealGeo = new THREE.CylinderGeometry(0.28, 0.30, 0.12, 24);
// Top face material (seal stamp)
var sealTopMat = new THREE.MeshStandardMaterial({ map: sealTexFood, roughness: 0.4 });
var sealSideMat = new THREE.MeshStandardMaterial({ color: 0xCC4444, roughness: 0.35, emissive: 0x330000, emissiveIntensity: 0.2 });
var foodGem = new THREE.Mesh(sealGeo, [sealSideMat, sealTopMat]);
foodGem.rotation.x = -Math.PI / 2; // Lay flat
foodGem.position.y = 0.05;
foodGroup.add(foodGem);

// Decorative ring
var foodRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.03, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xCC6644, roughness: 0.3, emissive: 0x330000, emissiveIntensity: 0.3 })
);
foodRing.rotation.x = Math.PI / 2;
foodRing.position.y = 0.05;
foodGroup.add(foodRing);

// Orbiting gold particles
var foodOrbiters = [];
for (var fo = 0; fo < 3; fo++) {
    var orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xDDCC88, transparent: true, opacity: 0.7, depthWrite: false })
    );
    foodGroup.add(orb);
    foodOrbiters.push({ mesh: orb, angle: fo * Math.PI * 2 / 3, radius: 0.45, speed: 1.5 + fo * 0.3, yOff: (fo - 1) * 0.1 });
}

sc.foodGroup = foodGroup;
sc.foodGlow = foodGlow;
sc.foodGem = foodGem;
sc.foodRing = foodRing;
sc.foodOrbiters = foodOrbiters;
sc.foodIsBonus = false;

sc.spawnFood = function(snake) {
    var gs = SNAKE.CONST.GRID_SIZE;
    var pos;
    do { pos = { x: Math.floor(Math.random() * gs), y: Math.floor(Math.random() * gs) }; }
    while (snake.some(function(s) { return s.x === pos.x && s.y === pos.y; }));
    var wp = SNAKE.gridToWorld(pos.x, pos.y);
    foodGroup.position.set(wp.x, -4.8, wp.z);
    var isBonus = Math.random() < 0.15;
    sc.foodIsBonus = isBonus;
    if (isBonus) {
        foodGem.material[0].color.set(0xCC8833);
        foodGem.material[1] = new THREE.MeshStandardMaterial({ map: sealTexBonus, roughness: 0.4 });
        foodGlow.color.set(0xEEBB66);
        foodRing.material.color.set(0xCC8833);
        foodGem.scale.setScalar(1.25);
    } else {
        foodGem.material[0].color.set(0xCC4444);
        foodGem.material[1] = new THREE.MeshStandardMaterial({ map: sealTexFood, roughness: 0.4 });
        foodGlow.color.set(0xEECC99);
        foodRing.material.color.set(0xCC6644);
        foodGem.scale.setScalar(1);
    }
    return pos;
};

// ═══════════════════════════════════════════════════════
// Power-ups: jade style (S4.2)
// ═══════════════════════════════════════════════════════
var powerUpGroup = new THREE.Group(); scene.add(powerUpGroup);
sc.powerUpGroup = powerUpGroup;

var PU_GEOS = {
    speedUp: new THREE.ConeGeometry(0.20, 0.40, 6),
    slowDown: new THREE.ConeGeometry(0.20, 0.40, 6),
    wallPass: new THREE.TorusGeometry(0.16, 0.05, 8, 12),
    magnet: new THREE.TorusGeometry(0.18, 0.04, 6, 12),
    shield: new THREE.IcosahedronGeometry(0.18, 0),
    shrink: new THREE.SphereGeometry(0.14, 8, 8),
    doubleScore: new THREE.OctahedronGeometry(0.20, 0)
};

sc.createPowerUpMesh = function(type) {
    var group = new THREE.Group();
    var geo = PU_GEOS[type] || new THREE.SphereGeometry(0.16, 8, 8);
    var mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: 0x5B8A6B,
        roughness: 0.25,
        emissive: 0x1a2a1a,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.85
    }));
    group.add(mesh);
    // Warm white-gold glow instead of neon
    var glow = new THREE.PointLight(0xEEEDD8, 1.5, 3);
    glow.position.y = 0.25;
    group.add(glow);
    var ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.25, 0.025, 8, 16),
        new THREE.MeshBasicMaterial({ color: 0x8AAB8A, transparent: true, opacity: 0.45, depthWrite: false })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    powerUpGroup.add(group);
    return { group: group, mesh: mesh, ring: ring, glow: glow, type: type };
};

sc.removePowerUpMesh = function(pu) {
    powerUpGroup.remove(pu.group);
    if (pu.glow) pu.glow.dispose && pu.glow.dispose();
};

sc.clearPowerUps = function() {
    while (powerUpGroup.children.length > 0) powerUpGroup.remove(powerUpGroup.children[0]);
};

// ═══════════════════════════════════════════════════════
// Obstacles: ink stones (maze mode)
// ═══════════════════════════════════════════════════════
var obstacleGroup = new THREE.Group(); scene.add(obstacleGroup);
sc.obstacleGroup = obstacleGroup;

sc.addObstacle = function(gx, gy) {
    var wp = SNAKE.gridToWorld(gx, gy);
    var obs = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.5, 0.78),
        new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.65, metalness: 0.05 })
    );
    obs.position.set(wp.x, -4.8, wp.z);
    obs.castShadow = true; obs.receiveShadow = true;
    obstacleGroup.add(obs);
};

sc.clearObstacles = function() {
    while (obstacleGroup.children.length > 0) obstacleGroup.remove(obstacleGroup.children[0]);
};

// ═══════════════════════════════════════════════════════
// Eat particles: ink splatter
// ═══════════════════════════════════════════════════════
var eatParticles = [];
var MAX_EAT = 30;
for (var ei = 0; ei < MAX_EAT; ei++) {
    var splat = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: 0, depthWrite: false })
    );
    splat.visible = false;
    scene.add(splat);
    eatParticles.push({ mesh: splat, vel: new THREE.Vector3(), life: 0 });
}
sc.eatParticles = eatParticles;

sc.triggerEatBurst = function(pos, comboLevel) {
    var count = Math.min(MAX_EAT, 8 + (comboLevel || 0) * 3);
    var splatColors = [0x1a1815, 0x2a2520, 0x3a3028, 0x4a3a2a];
    for (var i = 0; i < count; i++) {
        var ep = eatParticles[i];
        if (!ep) break;
        ep.mesh.position.copy(pos);
        ep.mesh.position.y += 0.1;
        ep.vel.set((Math.random() - 0.5) * 2.2, 1 + Math.random() * 2.5, (Math.random() - 0.5) * 2.2);
        ep.life = 0.4 + Math.random() * 0.6;
        ep.mesh.material.color.set(splatColors[Math.floor(Math.random() * splatColors.length)]);
        ep.mesh.material.opacity = 0.75;
        ep.mesh.visible = true;
        ep.mesh.scale.setScalar(0.4 + Math.random() * 1.0);
    }
};

sc.updateEatParticles = function(dt) {
    for (var i = 0; i < eatParticles.length; i++) {
        var ep = eatParticles[i];
        if (ep.life <= 0) { ep.mesh.visible = false; continue; }
        ep.life -= dt;
        ep.vel.y -= 2.5 * dt;
        ep.mesh.position.x += ep.vel.x * dt;
        ep.mesh.position.y += ep.vel.y * dt;
        ep.mesh.position.z += ep.vel.z * dt;
        ep.mesh.material.opacity = Math.max(0, ep.life * 1.2);
        if (ep.life <= 0) ep.mesh.visible = false;
    }
};

// ═══════════════════════════════════════════════════════
// Death ink animation (S4.4)
// ═══════════════════════════════════════════════════════
var deathInkBlot = null;
var deathInkParticles = [];
var deathInkActive = false;
var deathInkTimer = 0;
var MAX_DEATH_PARTICLES = 30;

// Pre-create death blot plane
var deathBlotGeo = new THREE.PlaneGeometry(1, 1);
var deathBlotMat = new THREE.MeshBasicMaterial({
    color: 0x1a1815,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide
});

// Pre-create death splatter particles
for (var di = 0; di < MAX_DEATH_PARTICLES; di++) {
    var dp = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: 0, depthWrite: false })
    );
    dp.visible = false;
    scene.add(dp);
    deathInkParticles.push({ mesh: dp, vel: new THREE.Vector3(), life: 0 });
}

sc.triggerDeathInk = function(pos) {
    // Remove old blot
    if (deathInkBlot) { scene.remove(deathInkBlot); deathInkBlot.geometry.dispose(); }

    deathInkBlot = new THREE.Mesh(deathBlotGeo, deathBlotMat.clone());
    deathInkBlot.position.copy(pos);
    deathInkBlot.position.y = -4.5;
    deathInkBlot.rotation.x = -Math.PI / 2;
    deathInkBlot.scale.setScalar(0.01);
    deathInkBlot.material.opacity = 0;
    scene.add(deathInkBlot);

    // Spawn splatter particles
    for (var i = 0; i < MAX_DEATH_PARTICLES; i++) {
        var dp = deathInkParticles[i];
        dp.mesh.position.copy(pos);
        dp.mesh.position.y = -4.5;
        dp.mesh.position.x += (Math.random() - 0.5) * 0.5;
        dp.mesh.position.z += (Math.random() - 0.5) * 0.5;
        dp.vel.set((Math.random() - 0.5) * 2.5, 0.3 + Math.random() * 1.5, (Math.random() - 0.5) * 2.5);
        dp.life = 0.8 + Math.random() * 0.8;
        dp.mesh.material.opacity = 0.45 + Math.random() * 0.3;
        dp.mesh.visible = true;
        dp.mesh.scale.setScalar(0.3 + Math.random() * 1.2);
    }
    deathInkActive = true;
    deathInkTimer = 0;
};

sc.clearDeathInk = function() {
    if (deathInkBlot) {
        scene.remove(deathInkBlot);
        deathInkBlot.geometry.dispose();
        deathInkBlot = null;
    }
    for (var i = 0; i < deathInkParticles.length; i++) {
        deathInkParticles[i].mesh.visible = false;
        deathInkParticles[i].life = 0;
    }
    deathInkActive = false;
    deathInkTimer = 0;
};

// ═══════════════════════════════════════════════════════
// Screen shake
// ═══════════════════════════════════════════════════════
var shakeAmount = 0, shakeDecay = 6;
sc.shakeAmount = 0;
sc.triggerScreenShake = function(intensity) { shakeAmount = Math.max(shakeAmount, intensity); sc.shakeAmount = shakeAmount; };

// ═══════════════════════════════════════════════════════
// Combo effects
// ═══════════════════════════════════════════════════════
sc.triggerComboEffect = function(worldPos, comboCount) {
    sc.triggerEatBurst(worldPos, Math.min(comboCount, 10));
};

sc.triggerComboBreakEffect = function() {
    shakeAmount = Math.max(shakeAmount, 0.5);
    sc.shakeAmount = shakeAmount;
};

// ═══════════════════════════════════════════════════════
// Trail dots (ink drops)
// ═══════════════════════════════════════════════════════
var trailDots = [];
var MAX_TRAIL = 12;
for (var ti = 0; ti < MAX_TRAIL; ti++) {
    var td = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: 0, depthWrite: false })
    );
    td.visible = false; scene.add(td);
    trailDots.push({ mesh: td, age: 0 });
}
var trailTimer = 0;
var trailHistory = [];
sc.trailDots = trailDots;
sc.trailTimer = trailTimer;
sc.trailHistory = trailHistory;

// ═══════════════════════════════════════════════════════
// Camera system
// ═══════════════════════════════════════════════════════
var CAM_NAMES = ['山水远眺', '近观游蛇', '墨蛇视角'];
var camTarget = new THREE.Vector3(0, -4, 0), camPos = new THREE.Vector3(0, 26, 20);
var camSmoothPos = new THREE.Vector3(0, 26, 20), camSmoothTarget = new THREE.Vector3(0, -4, 0);
var prevHeadLogical = new THREE.Vector3(0, -4.5, 0);
var camSensitivity = 0.5;

sc.camMode = 0;
sc.CAM_NAMES = CAM_NAMES;
sc.prevHeadLogical = prevHeadLogical;

sc.getHeadLogical = function(snake) {
    if (snake.length > 0) {
        var wp = SNAKE.gridToWorld(snake[0].x, snake[0].y);
        return new THREE.Vector3(wp.x, -4.5, wp.z);
    }
    return new THREE.Vector3(0, -4.5, 0);
};

sc.setCameraMode = function(mode, snake, direction) {
    sc.camMode = mode;
    SNAKE.state.camMode = mode;
    document.getElementById('camLabel').textContent = CAM_NAMES[mode];
    if (snakeMeshes.length > 0) {
        var hp = snakeMeshes[0].group.position;
        if (mode === 0) {
            camSmoothPos.set(0, 26, 20);
            camSmoothTarget.set(0, -4, 0);
        } else if (mode === 1) {
            camSmoothPos.set(hp.x - direction.x * 5, hp.y + 3.5, hp.z - direction.y * 5);
            camSmoothTarget.copy(hp); camSmoothTarget.y = -4;
        } else {
            var lg = sc.getHeadLogical(snake);
            camSmoothPos.set(lg.x - direction.x * 0.6, lg.y + 0.85, lg.z - direction.y * 0.6);
            camSmoothTarget.set(lg.x + direction.x * 6, lg.y + 0.4, lg.z + direction.y * 6);
        }
    }
    camera.position.copy(camSmoothPos);
    camera.lookAt(camSmoothTarget);
};

sc.setCameraSensitivity = function(val) { camSensitivity = SNAKE.clamp(val, 0.1, 1.0); };

sc.updateCamera = function(now, snake, direction, cm) {
    var headRender = snakeMeshes.length > 0 ? snakeMeshes[0].group.position.clone() : new THREE.Vector3(0, -4.5, 0);
    var mode = cm !== undefined ? cm : sc.camMode;
    var cs = camSensitivity * 2;

    if (mode === 0) {
        var hg = snake.length > 0 ? sc.getHeadLogical(snake) : new THREE.Vector3(0, -4.5, 0);
        camTarget.lerp(new THREE.Vector3(hg.x * 0.2, -4, hg.z * 0.2), 0.03 * cs);
        camPos.set(Math.sin(now * 0.25) * 2, 26, 20 + Math.cos(now * 0.3) * 1);
        camSmoothPos.lerp(camPos, 0.06 * cs);
        camSmoothTarget.lerp(camTarget, 0.06 * cs);
    } else if (mode === 1) {
        camTarget.lerp(new THREE.Vector3(headRender.x, -4, headRender.z), 0.25 * cs);
        camPos.set(headRender.x - direction.x * 5, headRender.y + 3.5, headRender.z - direction.y * 5);
        camSmoothPos.lerp(camPos, 0.25 * cs);
        camSmoothTarget.lerp(camTarget, 0.25 * cs);
    } else {
        var logical = sc.getHeadLogical(snake);
        var d = logical.distanceTo(prevHeadLogical);
        if (d > 6) { camSmoothPos.copy(logical); }
        camPos.set(logical.x - direction.x * 0.6, logical.y + 0.85, logical.z - direction.y * 0.6);
        camSmoothPos.lerp(camPos, 0.5 * cs);
        camSmoothTarget.set(logical.x + direction.x * 6, logical.y + 0.4, logical.z + direction.y * 6);
        prevHeadLogical.copy(logical);
    }

    camera.position.copy(camSmoothPos);
    if (shakeAmount > 0.001) {
        camera.position.x += (Math.random() - 0.5) * shakeAmount;
        camera.position.y += (Math.random() - 0.5) * shakeAmount * 0.6;
        camera.position.z += (Math.random() - 0.5) * shakeAmount;
    }
    camera.lookAt(camSmoothTarget);
};

// ═══════════════════════════════════════════════════════
// Quality tiers
// ═══════════════════════════════════════════════════════
sc.setQuality = function(level) {
    switch (level) {
        case 'low':
            renderer.setPixelRatio(1);
            renderer.shadowMap.enabled = false;
            keyLight.castShadow = false;
            MAX_TRAIL = 0;
            MAX_EAT = 8;
            break;
        case 'medium':
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.shadowMap.enabled = true;
            keyLight.shadow.mapSize.set(1024, 1024);
            MAX_TRAIL = 6;
            MAX_EAT = 15;
            break;
        default:
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            keyLight.shadow.mapSize.set(1024, 1024);
            MAX_TRAIL = 12;
            MAX_EAT = 30;
    }
};

// ═══════════════════════════════════════════════════════
// Resize
// ═══════════════════════════════════════════════════════
function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// ═══════════════════════════════════════════════════════
// Render
// ═══════════════════════════════════════════════════════
sc.render = function() { renderer.render(scene, camera); };

// ═══════════════════════════════════════════════════════
// Ambient update (per-frame)
// ═══════════════════════════════════════════════════════
var lastWaterRippleTime = 0;
var tailMoteTimer = 0;

sc.updateAmbient = function(now, dt) {
    // Shake decay
    if (shakeAmount > 0.001) { shakeAmount *= Math.exp(-shakeDecay * dt); sc.shakeAmount = shakeAmount; }
    else shakeAmount = 0;

    // Ink mote particles: gentle float
    for (var p = 0; p < particleData.length; p++) {
        var pd = particleData[p];
        pd.mesh.position.y = pd.baseY + Math.sin(now * pd.speed + pd.phase) * pd.amplitude;
        pd.mesh.material.opacity = 0.06 + Math.sin(now * 1.2 + pd.phase) * 0.05 + 0.07;
    }

    // Cloud drift
    if (cloudData) {
        for (var c = 0; c < cloudData.length; c++) {
            var cd = cloudData[c];
            cd.mesh.position.x = cd.baseX + Math.sin(now * cd.speed) * 5;
        }
    }

    // Water ripple animation (update texture periodically)
    if (now - lastWaterRippleTime > 0.4) {
        lastWaterRippleTime = now;
        var newRippleTex = _waterRippleTex(now);
        waterPlane.material.map.dispose();
        waterPlane.material.map = newRippleTex;
    }

    // Food animation
    foodGem.rotation.z += 0.02;
    foodGem.position.y = 0.08 + Math.sin(now * 2.5) * 0.1;
    foodRing.rotation.z += 0.015;
    foodRing.scale.setScalar(1 + Math.sin(now * 3) * 0.06);
    foodGlow.intensity = 2 + Math.sin(now * 3) * 0.6;
    for (var fo = 0; fo < foodOrbiters.length; fo++) {
        var orb = foodOrbiters[fo];
        orb.angle += orb.speed * dt;
        orb.mesh.position.x = Math.cos(orb.angle) * orb.radius;
        orb.mesh.position.z = Math.sin(orb.angle) * orb.radius;
        orb.mesh.position.y = foodGem.position.y + orb.yOff + Math.sin(now * 2.5 + fo) * 0.08;
    }

    // Tail motes update
    tailMoteTimer += dt;
    if (tailMoteTimer > 0.1 && snakeMeshes.length > 0 && SNAKE.state.isRunning) {
        tailMoteTimer = 0;
        var lastSeg = snakeMeshes[snakeMeshes.length - 1];
        if (lastSeg && lastSeg.group.visible) {
            _spawnTailMote(lastSeg.group.position);
        }
    }
    for (var tm = 0; tm < tailMotes.length; tm++) {
        var tmo = tailMotes[tm];
        if (tmo.life <= 0) { tmo.mesh.visible = false; continue; }
        tmo.life -= dt;
        tmo.mesh.position.y += 0.15 * dt;
        tmo.mesh.material.opacity = Math.max(0, tmo.life * 0.22);
        if (tmo.life <= 0) tmo.mesh.visible = false;
    }

    // Death ink animation
    if (deathInkActive && deathInkBlot) {
        deathInkTimer += dt;
        var blotProgress = Math.min(1, deathInkTimer / 1.5);
        // Expand blot: scale 0.01 → 4
        var blotScale = 0.01 + blotProgress * 4;
        deathInkBlot.scale.setScalar(blotScale);
        // Opacity: 0 → 0.2 → 0
        if (blotProgress < 0.5) {
            deathInkBlot.material.opacity = blotProgress * 2 * 0.2;
        } else {
            deathInkBlot.material.opacity = 0.2 - (blotProgress - 0.5) * 2 * 0.2;
        }
    }

    // Death ink particles
    for (var dpi = 0; dpi < deathInkParticles.length; dpi++) {
        var dpp = deathInkParticles[dpi];
        if (dpp.life <= 0) { dpp.mesh.visible = false; continue; }
        dpp.life -= dt;
        dpp.vel.y -= 1.2 * dt;
        dpp.mesh.position.x += dpp.vel.x * dt;
        dpp.mesh.position.y += dpp.vel.y * dt;
        dpp.mesh.position.z += dpp.vel.z * dt;
        dpp.mesh.material.opacity = Math.max(0, dpp.life * 0.45);
        if (dpp.life <= 0) dpp.mesh.visible = false;
    }
};

// ═══════════════════════════════════════════════════════
// Trail update
// ═══════════════════════════════════════════════════════
sc.updateTrail = function(dt) {
    trailTimer += dt;
    if (snakeMeshes.length > 0 && SNAKE.state.isRunning && trailTimer > 0.04) {
        trailTimer = 0;
        trailHistory.push(snakeMeshes[0].group.position.clone());
        if (trailHistory.length > MAX_TRAIL) trailHistory.shift();
    }
    for (var td = 0; td < trailDots.length; td++) {
        var tObj = trailDots[td];
        if (td < trailHistory.length) {
            tObj.mesh.visible = true;
            tObj.mesh.position.copy(trailHistory[td]);
            tObj.mesh.position.y += (Math.random() - 0.5) * 0.04;
            var alpha = (td / trailHistory.length) * 0.35;
            tObj.mesh.material.opacity = alpha;
            tObj.mesh.scale.setScalar(alpha);
            tObj.age = 0.4;
        } else if (tObj.age > 0) {
            tObj.age -= dt;
            tObj.mesh.material.opacity *= 0.9;
            if (tObj.age <= 0) tObj.mesh.visible = false;
        }
    }
};

})(SNAKE.scene);

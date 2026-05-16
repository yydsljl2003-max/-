// ── Three.js setup ──────────────────────────────
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setClearColor(0x050518);
document.getElementById('game3d').appendChild(renderer.domElement);

var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050518, 0.00025);
var camera = new THREE.PerspectiveCamera(52, 1, 0.3, 100);

// ── Lighting ────────────────────────────────────
scene.add(new THREE.AmbientLight(0x4466aa, 0.9));

var keyLight = new THREE.DirectionalLight(0xffeedd, 2.8);
keyLight.position.set(8, 20, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 60;
keyLight.shadow.camera.left = -18; keyLight.shadow.camera.right = 18;
keyLight.shadow.camera.top = 18; keyLight.shadow.camera.bottom = -18;
keyLight.shadow.bias = -0.00025;
scene.add(keyLight);

var fillLight = new THREE.DirectionalLight(0x8899cc, 1.4);
fillLight.position.set(-6, 10, -4);
scene.add(fillLight);

var rimLight = new THREE.DirectionalLight(0x6688cc, 1.8);
rimLight.position.set(0, 4, 14);
scene.add(rimLight);

// ── Arena platform ──────────────────────────────
var PLATFORM_SIZE = 20.8, PLATFORM_Y = -5.65, GRID_Y = -5.47;
var platform = new THREE.Mesh(
    new THREE.BoxGeometry(PLATFORM_SIZE, 0.3, PLATFORM_SIZE),
    new THREE.MeshStandardMaterial({ color: 0x1a1a3a, roughness: 0.35, metalness: 0.6 })
);
platform.position.y = PLATFORM_Y;
platform.receiveShadow = true; platform.castShadow = true;
scene.add(platform);

// Rim
var rimMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.25, metalness: 0.7, emissive: 0x112233, emissiveIntensity: 0.6 });
var RIM_Y = PLATFORM_Y + 0.2, RIM_EDGE = PLATFORM_SIZE / 2 - 0.05;
[
    [0, RIM_Y, -RIM_EDGE, new THREE.BoxGeometry(PLATFORM_SIZE + 0.3, 0.15, 0.25)],
    [0, RIM_Y, RIM_EDGE, new THREE.BoxGeometry(PLATFORM_SIZE + 0.3, 0.15, 0.25)],
    [-RIM_EDGE, RIM_Y, 0, new THREE.BoxGeometry(0.25, 0.15, PLATFORM_SIZE + 0.3)],
    [RIM_EDGE, RIM_Y, 0, new THREE.BoxGeometry(0.25, 0.15, PLATFORM_SIZE + 0.3)],
].forEach(function(r) {
    var rim = new THREE.Mesh(r[3], rimMat);
    rim.position.set(r[0], r[1], r[2]);
    rim.receiveShadow = true; rim.castShadow = true;
    scene.add(rim);
});

// Grid
var gridGroup = new THREE.Group();
gridGroup.position.y = GRID_Y;
var GRID_HALF = 10;
var gMat = new THREE.LineBasicMaterial({ color: 0x335577, transparent: true, opacity: 0.45 });
for (var gx = -GRID_HALF; gx <= GRID_HALF; gx++) {
    gridGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(gx, 0, -GRID_HALF), new THREE.Vector3(gx, 0, GRID_HALF)]), gMat));
}
for (var gz = -GRID_HALF; gz <= GRID_HALF; gz++) {
    gridGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-GRID_HALF, 0, gz), new THREE.Vector3(GRID_HALF, 0, gz)]), gMat));
}
var bHalf = GRID_HALF + 0.05;
gridGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-bHalf, 0, -bHalf), new THREE.Vector3(bHalf, 0, -bHalf),
        new THREE.Vector3(bHalf, 0, bHalf), new THREE.Vector3(-bHalf, 0, bHalf),
        new THREE.Vector3(-bHalf, 0, -bHalf)
    ]), new THREE.LineBasicMaterial({ color: 0x4477aa, transparent: true, opacity: 0.8 })));
scene.add(gridGroup);

// ── Corner pillars ──────────────────────────────
var PILLAR_EDGE = PLATFORM_SIZE / 2 - 0.4;
var pillars = [];
function createPillar(x, z) {
    var g = new THREE.Group();
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 1.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.2, metalness: 0.75, emissive: 0x111133, emissiveIntensity: 0.5 }));
    shaft.position.y = 0.7; shaft.castShadow = true; shaft.receiveShadow = true;
    g.add(shaft);
    var orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x5599ff, roughness: 0.08, metalness: 0.05, emissive: 0x3377dd, emissiveIntensity: 2 }));
    orb.position.y = 1.5; orb.castShadow = true;
    g.add(orb);
    var glow = new THREE.PointLight(0x5599ff, 2, 5);
    glow.position.y = 1.5; g.add(glow);
    g.position.set(x, PLATFORM_Y + 0.15, z);
    return { group: g, orb: orb, glow: glow };
}
[[-PILLAR_EDGE, -PILLAR_EDGE], [PILLAR_EDGE, -PILLAR_EDGE], [-PILLAR_EDGE, PILLAR_EDGE], [PILLAR_EDGE, PILLAR_EDGE]].forEach(function(pos) {
    var p = createPillar(pos[0], pos[1]); scene.add(p.group); pillars.push(p);
});

// ── Particles ───────────────────────────────────
var particlesGroup = new THREE.Group(); scene.add(particlesGroup);
var particleData = [];
for (var pi = 0; pi < 120; pi++) {
    var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.05, 4, 4),
        new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.55 + Math.random() * 0.15, 0.6, 0.5 + Math.random() * 0.4), transparent: true, opacity: 0.5 + Math.random() * 0.5, depthWrite: false }));
    dot.position.set((Math.random() - 0.5) * 32, Math.random() * 8 - 2, (Math.random() - 0.5) * 32);
    particlesGroup.add(dot);
    particleData.push({ mesh: dot, baseY: dot.position.y, speed: 0.3 + Math.random() * 0.9, phase: Math.random() * Math.PI * 2 });
}

// ── Eat particle burst ──────────────────────────
var eatParticles = [];
var MAX_EAT_PARTICLES = 30;
for (var ep = 0; ep < MAX_EAT_PARTICLES; ep++) {
    var epGeom = new THREE.SphereGeometry(0.06, 4, 4);
    var epMat = new THREE.MeshBasicMaterial({ color: 0xff6644, transparent: true, opacity: 0, depthWrite: false });
    var epMesh = new THREE.Mesh(epGeom, epMat);
    epMesh.visible = false;
    scene.add(epMesh);
    eatParticles.push({ mesh: epMesh, life: 0, velocity: new THREE.Vector3() });
}

function triggerEatBurst(pos) {
    var alive = 0;
    for (var i = 0; i < eatParticles.length; i++) {
        var p = eatParticles[i];
        p.mesh.position.copy(pos);
        p.mesh.position.y += 0.2;
        p.velocity.set((Math.random() - 0.5) * 4, Math.random() * 3 + 1, (Math.random() - 0.5) * 4);
        p.life = 0.4 + Math.random() * 0.5;
        p.mesh.visible = true;
        p.mesh.material.opacity = 1;
        p.mesh.material.color.setHSL(0.08 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.3);
        alive++;
    }
    return alive;
}

function updateEatParticles(dt) {
    for (var i = 0; i < eatParticles.length; i++) {
        var p = eatParticles[i];
        if (p.life <= 0) { p.mesh.visible = false; continue; }
        p.life -= dt;
        p.mesh.position.x += p.velocity.x * dt;
        p.mesh.position.y += p.velocity.y * dt;
        p.mesh.position.z += p.velocity.z * dt;
        p.velocity.y -= 4 * dt;
        p.mesh.material.opacity = Math.max(0, p.life / 0.9);
        p.mesh.scale.setScalar(p.life / 0.9);
    }
}

// ── Screen shake ────────────────────────────────
var shakeAmount = 0, shakeDecay = 6;
function triggerScreenShake(intensity) { shakeAmount = Math.max(shakeAmount, intensity); }

// ── Head trail ──────────────────────────────────
var trailDots = [];
var MAX_TRAIL = 12;
for (var td = 0; td < MAX_TRAIL; td++) {
    var tDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x44ccff, transparent: true, opacity: 0, depthWrite: false }));
    tDot.visible = false;
    scene.add(tDot);
    trailDots.push({ mesh: tDot, pos: new THREE.Vector3(), age: 0 });
}
var trailTimer = 0;
var trailHistory = [];

// Decorative rings
function decoRing(r, y, col, op) {
    var pts = []; for (var i = 0; i <= 128; i++) { var a = (i / 128) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false }));
}
scene.add(decoRing(12.5, -3, 0x4466aa, 0.25));
scene.add(decoRing(13.5, -1.5, 0x335588, 0.18));

// ── Game constants ──────────────────────────────
var GRID_SIZE = 20, BASE_INTERVAL = 150, MIN_INTERVAL = 60, HALF_GRID = GRID_SIZE / 2;

// ── Snake meshes ────────────────────────────────
var snakeMeshes = [];
var _sgGeom, _eyeGeom, _pupilGeom;
function _getSgGeom() { if (!_sgGeom) _sgGeom = new THREE.SphereGeometry(0.44, 16, 12); return _sgGeom; }
function _getEyeGeom() { if (!_eyeGeom) _eyeGeom = new THREE.SphereGeometry(0.12, 8, 8); return _eyeGeom; }
function _getPupilGeom() { if (!_pupilGeom) _pupilGeom = new THREE.SphereGeometry(0.07, 8, 8); return _pupilGeom; }

function createSnakeSegment(idx, total) {
    var g = new THREE.Group();
    var t = total > 1 ? idx / (total - 1) : 0;
    var body = new THREE.Mesh(_getSgGeom(), new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.05 + t * 0.15, 0.5 + t * 0.3, 0.9 - t * 0.3),
        roughness: 0.15, metalness: 0.15,
        emissive: new THREE.Color(0.02 + t * 0.03, 0.15 + t * 0.05, 0.35 - t * 0.1),
        emissiveIntensity: idx === 0 ? 2 : 0.8
    }));
    body.scale.set(1, 0.65, 1); body.position.y = 0.22;
    body.castShadow = true; body.receiveShadow = true;
    g.add(body);

    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 8, 16),
        new THREE.MeshBasicMaterial({ color: idx === 0 ? 0x44ddff : 0x335599, transparent: true, opacity: idx === 0 ? 0.7 : 0.3, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
    g.add(ring);

    if (idx === 0) {
        var em = new THREE.MeshBasicMaterial({ color: 0xffffff }), pm = new THREE.MeshBasicMaterial({ color: 0x111111 });
        var le = new THREE.Mesh(_getEyeGeom(), em); le.position.set(-0.22, 0.32, 0.28); g.add(le);
        var lp = new THREE.Mesh(_getPupilGeom(), pm); lp.position.set(-0.22, 0.34, 0.36); g.add(lp);
        var re = new THREE.Mesh(_getEyeGeom(), em); re.position.set(0.22, 0.32, 0.28); g.add(re);
        var rp = new THREE.Mesh(_getPupilGeom(), pm); rp.position.set(0.22, 0.34, 0.36); g.add(rp);
    }
    return { group: g, body: body, ring: ring };
}

function gridToWorld(gx, gy) { return { x: gx - HALF_GRID + 0.5, z: gy - HALF_GRID + 0.5 }; }

function rebuildSnakeMeshes(snake) {
    while (snakeMeshes.length > snake.length) { scene.remove(snakeMeshes.pop().group); }
    while (snakeMeshes.length < snake.length) {
        var i = snakeMeshes.length;
        var seg = createSnakeSegment(i, snake.length);
        var wp = gridToWorld(snake[i].x, snake[i].y);
        seg.group.position.set(wp.x, -4.5, wp.z);
        seg.group.userData = { prevX: wp.x, prevZ: wp.z, targetX: wp.x, targetZ: wp.z };
        scene.add(seg.group);
        snakeMeshes.push(seg);
    }
}

function updateSnakeTargets(snake, direction) {
    trailHistory.length = 0;
    for (var i = 0; i < snake.length; i++) {
        if (!snakeMeshes[i]) break;
        var wp = gridToWorld(snake[i].x, snake[i].y);
        snakeMeshes[i].group.userData.targetX = wp.x;
        snakeMeshes[i].group.userData.targetZ = wp.z;
        if (i === 0) {
            snakeMeshes[i].group.rotation.y = Math.atan2(direction.x, direction.y);
            trailHistory.push(new THREE.Vector3(wp.x, -4.5, wp.z));
        }
    }
}

function storePrevPositions() {
    for (var i = 0; i < snakeMeshes.length; i++) {
        var ud = snakeMeshes[i].group.userData;
        ud.prevX = snakeMeshes[i].group.position.x;
        ud.prevZ = snakeMeshes[i].group.position.z;
    }
}

// ── Food ────────────────────────────────────────
var foodGroup = new THREE.Group(); scene.add(foodGroup);
var foodGlow = new THREE.PointLight(0xff5533, 3, 5); foodGlow.position.y = 0.4; foodGroup.add(foodGlow);
var foodGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0),
    new THREE.MeshStandardMaterial({ color: 0xff3344, roughness: 0.05, metalness: 0.05, emissive: 0xff1122, emissiveIntensity: 1.6 }));
foodGem.position.y = 0.2; foodGem.castShadow = true; foodGroup.add(foodGem);
foodGem.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff9988 })));
var foodRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xff6644, transparent: true, opacity: 0.7, depthWrite: false }));
foodRing.rotation.x = Math.PI / 2; foodRing.position.y = 0.2; foodGroup.add(foodRing);

// Food orbiting particles
var foodOrbiters = [];
for (var fo = 0; fo < 6; fo++) {
    var fop = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xffaa66, transparent: true, opacity: 0.7, depthWrite: false }));
    foodGroup.add(fop);
    foodOrbiters.push({ mesh: fop, angle: (fo / 6) * Math.PI * 2, radius: 0.5 + Math.random() * 0.15, speed: 1.5 + Math.random() * 1.5, yOff: (Math.random() - 0.5) * 0.3 });
}

var foodIsBonus = false;
function spawnFood(snake) {
    var pos;
    do { pos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }; }
    while (snake.some(function(s) { return s.x === pos.x && s.y === pos.y; }));
    var wp = gridToWorld(pos.x, pos.y);
    foodGroup.position.set(wp.x, -4.8, wp.z);
    // 15% chance of bonus food
    foodIsBonus = Math.random() < 0.15;
    if (foodIsBonus) {
        foodGem.material.color.set(0xffaa00);
        foodGem.material.emissive.set(0xff8800);
        foodGem.material.emissiveIntensity = 2.2;
        foodGlow.color.set(0xffaa00);
        foodRing.material.color.set(0xffaa00);
        foodGem.scale.setScalar(1.3);
        for (var fo = 0; fo < foodOrbiters.length; fo++) {
            foodOrbiters[fo].mesh.material.color.set(0xffcc00);
        }
    } else {
        foodGem.material.color.set(0xff3344);
        foodGem.material.emissive.set(0xff1122);
        foodGem.material.emissiveIntensity = 1.6;
        foodGlow.color.set(0xff5533);
        foodRing.material.color.set(0xff6644);
        foodGem.scale.setScalar(1);
        for (var fo = 0; fo < foodOrbiters.length; fo++) {
            foodOrbiters[fo].mesh.material.color.set(0xffaa66);
        }
    }
    return pos;
}

// ── Head glow ───────────────────────────────────
var headGlow = new THREE.PointLight(0x44ccff, 2.5, 4); headGlow.visible = false; scene.add(headGlow);

// ── Camera ──────────────────────────────────────
var camMode = 0;
var CAM_NAMES = ['等距视角', '第三人称', '第一人称'];
var camTarget = new THREE.Vector3(0, -4, 0), camPos = new THREE.Vector3(0, 26, 20);
var camSmoothPos = new THREE.Vector3(0, 26, 20), camSmoothTarget = new THREE.Vector3(0, -4, 0);
var prevHeadLogical = new THREE.Vector3(0, -4.5, 0);

function getHeadLogical(snake) {
    if (snake.length > 0) { var wp = gridToWorld(snake[0].x, snake[0].y); return new THREE.Vector3(wp.x, -4.5, wp.z); }
    return new THREE.Vector3(0, -4.5, 0);
}

function setCameraMode(mode) {
    camMode = mode;
    document.getElementById('camLabel').textContent = CAM_NAMES[mode];
    // Jump camera to correct position for the new mode — don't lerp from old position
    if (snakeMeshes.length > 0) {
        var hp = snakeMeshes[0].group.position;
        if (mode === 0) {
            camSmoothPos.set(0, 26, 20);
            camSmoothTarget.set(0, -4, 0);
        } else if (mode === 1) {
            camSmoothPos.set(hp.x - direction.x * 5, hp.y + 3.5, hp.z - direction.y * 5);
            camSmoothTarget.copy(hp); camSmoothTarget.y = -4;
        } else {
            var lg = getHeadLogical(snake);
            camSmoothPos.set(lg.x - direction.x * 0.6, lg.y + 0.85, lg.z - direction.y * 0.6);
            camSmoothTarget.set(lg.x + direction.x * 6, lg.y + 0.4, lg.z + direction.y * 6);
        }
    }
    camera.position.copy(camSmoothPos);
    camera.lookAt(camSmoothTarget);
}

function updateCamera(now, snake, direction) {
    var headRender = snakeMeshes.length > 0 ? snakeMeshes[0].group.position.clone() : new THREE.Vector3(0, -4.5, 0);

    if (camMode === 0) {
        // ISO: orbit above arena center, slowly tracking the snake
        var hg = snake.length > 0 ? getHeadLogical(snake) : new THREE.Vector3(0, -4.5, 0);
        camTarget.lerp(new THREE.Vector3(hg.x * 0.2, -4, hg.z * 0.2), 0.03);
        camPos.set(Math.sin(now * 0.25) * 2, 26, 20 + Math.cos(now * 0.3) * 1);
        camSmoothPos.lerp(camPos, 0.06);
        camSmoothTarget.lerp(camTarget, 0.06);
    } else if (camMode === 1) {
        // Third person: behind and above snake, tight follow
        camTarget.lerp(new THREE.Vector3(headRender.x, -4, headRender.z), 0.25);
        camPos.set(headRender.x - direction.x * 5, headRender.y + 3.5, headRender.z - direction.y * 5);
        camSmoothPos.lerp(camPos, 0.25);
        camSmoothTarget.lerp(camTarget, 0.25);
    } else {
        // First person: at snake head, looking forward
        var logical = getHeadLogical(snake);
        var d = logical.distanceTo(prevHeadLogical);
        if (d > 6) { camSmoothPos.copy(logical); }
        camPos.set(logical.x - direction.x * 0.6, logical.y + 0.85, logical.z - direction.y * 0.6);
        camSmoothPos.lerp(camPos, 0.5);
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
}

// ── Resize ──────────────────────────────────────
function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

/**
 * ============================================
 * INTERACTIVE BIRTHDAY EXPERIENCE
 * Complete AR Journey with Both Hands
 * ============================================
 * 
 * GESTURE MAP:
 * - Left Hand: Stable foundation (tree grows from it)
 * - Right Hand: Magic actions
 *   ☝️ Point → Grow branch
 *   🤏 Pinch → Bloom flower
 *   👋 Wave → Magic wind
 *   ✌️ Peace → Butterflies
 *   👍 Thumbs Up → Glow
 *   🤲 Both Hands → Magic Burst + Birthday Reveal
 * ============================================
 */

// ============================================
// STATE
// ============================================
const State = {
    isReady: false,
    isTracking: false,
    flowerCount: 0,
    seedCount: 0,
    butterflyCount: 0,
    
    // Hand tracking
    leftHand: null,
    rightHand: null,
    bothHands: false,
    
    // Gesture states
    currentGesture: 'none',
    gestureCooldown: 300,
    lastGestureTime: 0,
    
    // Visual flags
    isGlowing: false,
    isRevealed: false,
    treeLevel: 0,
    
    // DOM
    elements: {}
};

// ============================================
// DOM CACHE
// ============================================
function cacheElements() {
    State.elements = {
        video: document.getElementById('camera-feed'),
        handCanvas: document.getElementById('hand-canvas'),
        threeCanvas: document.getElementById('three-canvas'),
        loadingScreen: document.getElementById('loading-screen'),
        beginScreen: document.getElementById('begin-screen'),
        beginButton: document.getElementById('begin-button'),
        actionHint: document.getElementById('action-hint'),
        flowerCounter: document.getElementById('flower-counter'),
        seedCounter: document.getElementById('seed-counter'),
        butterflyCounter: document.getElementById('butterfly-counter'),
        leftHandState: document.getElementById('left-hand-state'),
        rightHandState: document.getElementById('right-hand-state'),
        gestureGuide: document.getElementById('gesture-guide'),
        birthdayReveal: document.getElementById('birthday-reveal'),
        revealTitle: document.querySelector('.reveal-title'),
        revealMessage: document.querySelector('.reveal-message')
    };
}

// ============================================
// THREE.JS MANAGER - 3D Effects
// ============================================
class ThreeManager {
    constructor() {
        this.canvas = State.elements.threeCanvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Collections
        this.flowers = [];
        this.butterflies = [];
        this.branches = [];
        this.particles = [];
        this.tree = null;
        
        this.setupScene();
        this.animate();
        this.handleResize();
    }
    
    setupScene() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x222244, 0.5);
        this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(5, 10, 7);
        this.scene.add(light);
        
        // Background particles
        this.createBackgroundParticles();
        
        // Create initial tree trunk
        this.createTreeTrunk();
    }
    
    createBackgroundParticles() {
        const geometry = new THREE.BufferGeometry();
        const count = 200;
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10 + 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x8855ff,
            size: 0.03,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        
        this.bgParticles = new THREE.Points(geometry, material);
        this.scene.add(this.bgParticles);
    }
    
    createTreeTrunk() {
        const geometry = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 0.8,
            metalness: 0.1
        });
        this.tree = new THREE.Mesh(geometry, material);
        this.tree.position.set(0, -0.5, 0);
        this.scene.add(this.tree);
    }
    
    // ============================================
    // TREE GROWTH
    // ============================================
    growTree() {
        if (State.treeLevel >= 5) return;
        State.treeLevel++;
        
        // Scale up the tree
        const scale = 1 + State.treeLevel * 0.3;
        gsap.to(this.tree.scale, {
            x: scale,
            y: scale,
            z: scale,
            duration: 1.2,
            ease: 'back.out(1.7)'
        });
        
        // Add branches at certain levels
        if (State.treeLevel >= 2) {
            this.addBranch(0.8, 0.6, Math.PI * 0.3);
            this.addBranch(0.8, -0.6, Math.PI * 0.7);
        }
        if (State.treeLevel >= 3) {
            this.addBranch(1.2, 0.8, Math.PI * 0.1);
            this.addBranch(1.2, -0.8, Math.PI * 0.9);
        }
        if (State.treeLevel >= 4) {
            this.addBranch(1.6, 0.4, Math.PI * 0.5);
            this.addBranch(1.6, -0.4, Math.PI * 0.5);
        }
        
        this.createGrowthBurst();
    }
    
    addBranch(height, angle, rotation) {
        const geometry = new THREE.CylinderGeometry(0.05, 0.08, 0.6, 4);
        const material = new THREE.MeshStandardMaterial({
            color: 0x6b4c3b,
            roughness: 0.8
        });
        const branch = new THREE.Mesh(geometry, material);
        
        const radius = 0.4 * (1 + State.treeLevel * 0.1);
        branch.position.set(
            Math.cos(rotation) * radius,
            height,
            Math.sin(rotation) * radius
        );
        branch.rotation.z = angle;
        branch.rotation.y = rotation;
        
        this.scene.add(branch);
        this.branches.push(branch);
        
        // Add leaf cluster at branch tip
        this.addLeafCluster(
            Math.cos(rotation) * (radius + 0.3),
            height + 0.3,
            Math.sin(rotation) * (radius + 0.3)
        );
    }
    
    addLeafCluster(x, y, z) {
        const geometry = new THREE.SphereGeometry(0.15, 6, 6);
        const material = new THREE.MeshStandardMaterial({
            color: 0x34d399,
            roughness: 0.4,
            metalness: 0.1,
            emissive: 0x34d399,
            emissiveIntensity: 0.1
        });
        const leaf = new THREE.Mesh(geometry, material);
        leaf.position.set(x, y, z);
        leaf.scale.set(1, 1.5, 1);
        this.scene.add(leaf);
    }
    
    createGrowthBurst() {
        const colors = ['#34d399', '#f7d44a', '#ff6b9d', '#a855f7'];
        for (let i = 0; i < 30; i++) {
            const particle = this.createParticle(
                0, 1, 0,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3 + 1,
                (Math.random() - 0.5) * 3,
                colors[Math.floor(Math.random() * colors.length)],
                0.05 + Math.random() * 0.08
            );
            this.scene.add(particle);
            this.particles.push(particle);
            
            gsap.to(particle.position, {
                x: particle.position.x + (Math.random() - 0.5) * 2,
                y: particle.position.y + Math.random() * 2 + 1,
                z: particle.position.z + (Math.random() - 0.5) * 2,
                duration: 1.5,
                ease: 'power2.out',
                onComplete: () => {
                    this.scene.remove(particle);
                    this.particles = this.particles.filter(p => p !== particle);
                }
            });
            gsap.to(particle.material, {
                opacity: 0,
                duration: 1.2,
                delay: 0.3
            });
        }
    }
    
    // ============================================
    // FLOWERS
    // ============================================
    bloomFlower(x, y, z) {
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4', '#ff2d95'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Petals
        const petalCount = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const geometry = new THREE.SphereGeometry(0.08, 6, 6);
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.2,
                roughness: 0.3,
                metalness: 0.1
            });
            const petal = new THREE.Mesh(geometry, material);
            petal.position.set(
                Math.cos(angle) * 0.2,
                0,
                Math.sin(angle) * 0.2
            );
            petal.scale.set(1, 0.3, 0.7);
            group.add(petal);
        }
        
        // Center
        const centerGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const centerMat = new THREE.MeshStandardMaterial({
            color: 0xf7d44a,
            emissive: 0xf7d44a,
            emissiveIntensity: 0.3
        });
        const center = new THREE.Mesh(centerGeo, centerMat);
        group.add(center);
        
        this.scene.add(group);
        this.flowers.push(group);
        
        // Animate bloom
        group.scale.set(0, 0, 0);
        gsap.to(group.scale, {
            x: 1, y: 1, z: 1,
            duration: 0.8,
            ease: 'back.out(1.7)'
        });
        
        // Float animation
        gsap.to(group.position, {
            y: y + 0.1,
            duration: 2,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        // Glow pulse
        gsap.to(group.children[0]?.material, {
            emissiveIntensity: 0.4,
            duration: 1,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        // Create petal burst
        this.createPetalBurst(x, y, z, color);
        
        State.flowerCount++;
        this.updateCounters();
    }
    
    createPetalBurst(x, y, z, color) {
        for (let i = 0; i < 12; i++) {
            const particle = this.createParticle(
                x, y, z,
                (Math.random() - 0.5) * 0.5,
                Math.random() * 0.5 + 0.2,
                (Math.random() - 0.5) * 0.5,
                color,
                0.02 + Math.random() * 0.03
            );
            this.scene.add(particle);
            this.particles.push(particle);
            
            gsap.to(particle.position, {
                x: particle.position.x + (Math.random() - 0.5) * 0.8,
                y: particle.position.y + Math.random() * 0.8 + 0.3,
                z: particle.position.z + (Math.random() - 0.5) * 0.8,
                duration: 1.2,
                ease: 'power2.out',
                onComplete: () => {
                    this.scene.remove(particle);
                    this.particles = this.particles.filter(p => p !== particle);
                }
            });
            gsap.to(particle.material, {
                opacity: 0,
                duration: 0.8,
                delay: 0.4
            });
        }
    }
    
    // ============================================
    // BUTTERFLIES
    // ============================================
    createButterfly() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.06, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        group.add(body);
        
        // Wings
        const wingColors = ['#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4', '#f7d44a'];
        const color = wingColors[Math.floor(Math.random() * wingColors.length)];
        
        const wingGeo = new THREE.PlaneGeometry(0.12, 0.08);
        const wingMat = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            emissive: color,
            emissiveIntensity: 0.1
        });
        
        // Left wing
        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.x = -0.06;
        leftWing.rotation.z = -0.3;
        group.add(leftWing);
        
        // Right wing
        const rightWing = new THREE.Mesh(wingGeo, wingMat);
        rightWing.position.x = 0.06;
        rightWing.rotation.z = 0.3;
        group.add(rightWing);
        
        // Position randomly around the tree
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.5 + Math.random() * 1.5;
        const height = 0.5 + Math.random() * 2;
        
        group.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        group.rotation.y = Math.random() * Math.PI * 2;
        group.scale.set(0, 0, 0);
        
        this.scene.add(group);
        this.butterflies.push(group);
        
        // Animate appearance
        gsap.to(group.scale, {
            x: 1, y: 1, z: 1,
            duration: 0.6,
            ease: 'back.out(1.7)'
        });
        
        // Flapping animation
        const flapDuration = 0.3 + Math.random() * 0.2;
        gsap.to(leftWing.rotation, {
            x: 0.6,
            duration: flapDuration,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
        gsap.to(rightWing.rotation, {
            x: 0.6,
            duration: flapDuration,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
        
        // Flying path
        this.animateButterflyFlight(group);
        
        State.butterflyCount++;
        this.updateCounters();
    }
    
    animateButterflyFlight(butterfly) {
        const path = [];
        const steps = 30;
        for (let i = 0; i < steps; i++) {
            path.push({
                x: (Math.random() - 0.5) * 3,
                y: 0.5 + Math.random() * 2,
                z: (Math.random() - 0.5) * 3
            });
        }
        
        let currentStep = 0;
        const fly = () => {
            if (!butterfly.parent) return;
            
            const target = path[currentStep % path.length];
            gsap.to(butterfly.position, {
                x: target.x,
                y: target.y,
                z: target.z,
                duration: 2 + Math.random() * 1,
                ease: 'sine.inOut',
                onComplete: () => {
                    currentStep++;
                    fly();
                }
            });
            
            // Rotate toward movement direction
            gsap.to(butterfly.rotation, {
                y: Math.atan2(target.x - butterfly.position.x, target.z - butterfly.position.z),
                duration: 0.5,
                ease: 'power2.out'
            });
        };
        
        // Start after a delay
        setTimeout(fly, 500 + Math.random() * 500);
    }
    
    // ============================================
    // PARTICLES
    // ============================================
    createParticle(x, y, z, dx, dy, dz, color, size) {
        const geometry = new THREE.SphereGeometry(size, 6, 6);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(x, y, z);
        return particle;
    }
    
    // ============================================
    // MAGIC WIND
    // ============================================
    createMagicWind() {
        const colors = ['#06b6d4', '#3b82f6', '#a855f7', '#ff6b9d'];
        for (let i = 0; i < 50; i++) {
            const particle = this.createParticle(
                (Math.random() - 0.5) * 4,
                Math.random() * 3,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 2,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 2,
                colors[Math.floor(Math.random() * colors.length)],
                0.02 + Math.random() * 0.04
            );
            this.scene.add(particle);
            this.particles.push(particle);
            
            const duration = 1.5 + Math.random() * 1;
            gsap.to(particle.position, {
                x: particle.position.x + (Math.random() - 0.5) * 4,
                y: particle.position.y + Math.random() * 4 + 2,
                z: particle.position.z + (Math.random() - 0.5) * 4,
                duration: duration,
                ease: 'power1.out',
                onComplete: () => {
                    this.scene.remove(particle);
                    this.particles = this.particles.filter(p => p !== particle);
                }
            });
            gsap.to(particle.material, {
                opacity: 0,
                duration: duration * 0.7,
                delay: duration * 0.2
            });
        }
    }
    
    // ============================================
    // GLOW EFFECT
    // ============================================
    createGlow() {
        const colors = ['#f7d44a', '#ff2d95', '#b44dff', '#4d9eff'];
        for (let i = 0; i < 80; i++) {
            const particle = this.createParticle(
                (Math.random() - 0.5) * 5,
                Math.random() * 4,
                (Math.random() - 0.5) * 5,
                0, 0, 0,
                colors[Math.floor(Math.random() * colors.length)],
                0.01 + Math.random() * 0.03
            );
            this.scene.add(particle);
            this.particles.push(particle);
            
            gsap.to(particle.position, {
                x: particle.position.x + (Math.random() - 0.5) * 1.5,
                y: particle.position.y + (Math.random() - 0.5) * 1.5,
                z: particle.position.z + (Math.random() - 0.5) * 1.5,
                duration: 1.5,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            });
            gsap.to(particle.material, {
                opacity: 0.3 + Math.random() * 0.7,
                duration: 1,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    // ============================================
    // MAGIC BURST + REVEAL
    // ============================================
    createMagicBurst() {
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4', '#ff2d95'];
        for (let i = 0; i < 150; i++) {
            const particle = this.createParticle(
                (Math.random() - 0.5) * 2,
                Math.random() * 3,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 8,
                Math.random() * 6 + 2,
                (Math.random() - 0.5) * 8,
                colors[Math.floor(Math.random() * colors.length)],
                0.02 + Math.random() * 0.06
            );
            this.scene.add(particle);
            this.particles.push(particle);
            
            gsap.to(particle.position, {
                x: particle.position.x + (Math.random() - 0.5) * 6,
                y: particle.position.y + Math.random() * 6 + 4,
                z: particle.position.z + (Math.random() - 0.5) * 6,
                duration: 2 + Math.random() * 1,
                ease: 'power2.out',
                onComplete: () => {
                    this.scene.remove(particle);
                    this.particles = this.particles.filter(p => p !== particle);
                }
            });
            gsap.to(particle.material, {
                opacity: 0,
                duration: 1.5,
                delay: 0.5 + Math.random() * 0.5
            });
        }
        
        // Show birthday reveal
        State.isRevealed = true;
        State.elements.birthdayReveal.classList.add('visible');
        
        // Animate sparkles in reveal
        const sparkles = document.querySelector('.reveal-sparkles');
        const sparkleChars = ['✨', '⭐', '🌟', '💫', '🎂', '🎉', '🎊', '🌸'];
        let sparkleText = '';
        for (let i = 0; i < 20; i++) {
            sparkleText += sparkleChars[Math.floor(Math.random() * sparkleChars.length)];
        }
        sparkles.textContent = sparkleText;
        
        gsap.to(sparkles, {
            opacity: 0.3,
            duration: 0.5,
            yoyo: true,
            repeat: -1
        });
    }
    
    // ============================================
    // UPDATE COUNTERS
    // ============================================
    updateCounters() {
        State.elements.flowerCounter.textContent = State.flowerCount;
        State.elements.seedCounter.textContent = State.seedCount;
        State.elements.butterflyCounter.textContent = State.butterflyCount;
    }
    
    // ============================================
    // ANIMATE
    // ============================================
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate background particles
        if (this.bgParticles) {
            this.bgParticles.rotation.y += 0.0005;
        }
        
        // Animate butterflies with gentle bobbing
        this.butterflies.forEach(b => {
            if (b.position) {
                b.position.y += Math.sin(Date.now() / 1000 + b.id) * 0.001;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
}

// ============================================
// HAND TRACKING MANAGER
// ============================================
class HandTrackingManager {
    constructor(threeManager) {
        this.three = threeManager;
        this.canvas = State.elements.handCanvas;
        this.ctx = this.canvas.getContext('2d');
        this.video = State.elements.video;
        
        this.leftHand = null;
        this.rightHand = null;
        this.previousLeft = null;
        this.previousRight = null;
        this.isBothHands = false;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    async initialize() {
        try {
            this.updateStatus('✦ starting camera ✦');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            this.video.srcObject = stream;
            await this.video.play();
            
            this.updateStatus('✦ loading hand tracking ✦');
            
            const hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });
            
            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6
            });
            
            hands.onResults((results) => this.handleResults(results));
            
            const camera = new Camera(this.video, {
                onFrame: async () => {
                    try { await hands.send({ image: this.video }); } catch (e) {}
                },
                width: 640,
                height: 480
            });
            
            await camera.start();
            
            this.updateStatus('✦ ready ✦');
            setTimeout(() => this.hideLoading(), 800);
            
            console.log('✅ Hand tracking initialized (both hands)');
            
        } catch (error) {
            console.error('❌ Camera error:', error);
            this.showCameraError();
        }
    }
    
    updateStatus(text) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) loadingText.textContent = text;
    }
    
    hideLoading() {
        const screen = State.elements.loadingScreen;
        if (screen) {
            screen.classList.add('hidden');
            setTimeout(() => {
                screen.style.display = 'none';
                State.isReady = true;
            }, 800);
        }
    }
    
    showCameraError() {
        const screen = State.elements.loadingScreen;
        if (screen) {
            screen.innerHTML = `
                <div style="text-align:center;color:white;padding:20px;">
                    <div style="font-size:4rem;margin-bottom:20px;">📷</div>
                    <h2 style="font-weight:300;letter-spacing:0.1em;">camera access required</h2>
                    <p style="margin:20px auto;color:rgba(255,255,255,0.5);">
                        please allow camera access for the experience
                    </p>
                    <button onclick="location.reload()" style="
                        background:rgba(255,255,255,0.1);
                        border:1px solid rgba(255,255,255,0.2);
                        padding:12px 32px;
                        border-radius:40px;
                        font-size:0.85rem;
                        color:white;
                        cursor:pointer;
                        letter-spacing:0.1em;
                    ">✦ retry ✦</button>
                </div>
            `;
        }
    }
    
    handleResults(results) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let leftHand = null;
        let rightHand = null;
        
        if (results.multiHandLandmarks) {
            results.multiHandLandmarks.forEach((landmarks, index) => {
                const handedness = results.multiHandedness[index].label;
                if (handedness === 'Left') leftHand = landmarks;
                else rightHand = landmarks;
            });
        }
        
        this.leftHand = leftHand;
        this.rightHand = rightHand;
        State.leftHand = leftHand;
        State.rightHand = rightHand;
        
        // Draw both hands
        if (leftHand) this.drawHand(leftHand, 'left');
        if (rightHand) this.drawHand(rightHand, 'right');
        
        // Update UI
        this.updateUI(leftHand, rightHand);
        
        // Process gestures
        if (leftHand && rightHand) {
            State.bothHands = true;
            this.processBothHands(leftHand, rightHand);
        } else if (rightHand) {
            State.bothHands = false;
            this.processRightHand(rightHand);
        } else {
            State.bothHands = false;
            this.resetGestures();
        }
        
        // Store for next frame
        this.previousLeft = leftHand;
        this.previousRight = rightHand;
    }
    
    drawHand(landmarks, side) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        const connections = [
            [0,1],[1,2],[2,3],[3,4],
            [0,5],[5,6],[6,7],[7,8],
            [0,9],[9,10],[10,11],[11,12],
            [0,13],[13,14],[14,15],[15,16],
            [0,17],[17,18],[18,19],[19,20],
            [5,9],[9,13],[13,17]
        ];
        
        const color = side === 'left' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 107, 157, 0.3)';
        const glowColor = side === 'left' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 107, 157, 0.1)';
        
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = 10;
        
        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x * w, p1.y * h);
            this.ctx.lineTo(p2.x * w, p2.y * h);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        });
        
        this.ctx.shadowBlur = 0;
        
        const colors = side === 'left' 
            ? ['#06b6d4', '#3b82f6', '#06b6d4', '#3b82f6', '#06b6d4']
            : ['#ff6b9d', '#ff2d95', '#ff6b9d', '#ff2d95', '#ff6b9d'];
        
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * w;
            const y = landmark.y * h;
            const color = colors[Math.floor(index / 4) % colors.length];
            
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 12);
            gradient.addColorStop(0, color + '40');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = color + '80';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }
    
    updateUI(left, right) {
        const leftState = State.elements.leftHandState;
        const rightState = State.elements.rightHandState;
        
        if (left) {
            leftState.textContent = 'stable ✦';
            leftState.style.color = '#06b6d4';
        } else {
            leftState.textContent = 'waiting';
            leftState.style.color = 'rgba(255,255,255,0.3)';
        }
        
        if (right) {
            rightState.textContent = 'magic ready';
            rightState.style.color = '#ff6b9d';
        } else {
            rightState.textContent = 'waiting';
            rightState.style.color = 'rgba(255,255,255,0.3)';
        }
        
        // Action hint
        const hint = State.elements.actionHint;
        if (left && right) {
            hint.textContent = '✦ both hands detected • use right hand for magic ✦';
            hint.style.color = 'rgba(255,255,255,0.8)';
        } else if (right) {
            hint.textContent = '✦ show left hand to create the tree ✦';
            hint.style.color = 'rgba(255,255,255,0.5)';
        } else if (left) {
            hint.textContent = '✦ show right hand to perform magic ✦';
            hint.style.color = 'rgba(255,255,255,0.5)';
        } else {
            hint.textContent = '✦ show both hands to begin ✦';
            hint.style.color = 'rgba(255,255,255,0.3)';
        }
        
        // Gesture guide
        this.updateGestureGuide(right);
    }
    
    updateGestureGuide(rightHand) {
        const items = State.elements.gestureGuide.querySelectorAll('.gesture-item');
        items.forEach(item => item.classList.remove('active'));
        
        if (!rightHand) return;
        
        const gesture = this.detectGesture(rightHand);
        items.forEach(item => {
            if (item.dataset.gesture === gesture) {
                item.classList.add('active');
            }
        });
    }
    
    detectGesture(landmarks) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        const middle = landmarks[12];
        const ring = landmarks[16];
        const pinky = landmarks[20];
        
        const thumbIndexDist = this.distance(thumb, index);
        const indexMiddleDist = this.distance(index, middle);
        const middleRingDist = this.distance(middle, ring);
        const ringPinkyDist = this.distance(ring, pinky);
        
        // POINT: Index extended, others folded
        const indexExtended = index.y < landmarks[6].y - 0.03;
        const middleFolded = middle.y > landmarks[10].y;
        if (indexExtended && middleFolded) return 'point';
        
        // PINCH: Thumb and index close
        if (thumbIndexDist < 0.04) return 'pinch';
        
        // PEACE: Index and middle extended
        if (indexExtended && middle.y < landmarks[10].y - 0.02) return 'peace';
        
        // WAVE: All fingers extended and spread (detect via movement)
        if (thumbIndexDist > 0.1 && indexMiddleDist > 0.08 && middleRingDist > 0.08) {
            return 'wave';
        }
        
        // THUMBS UP: Thumb up, others folded
        const thumbUp = thumb.y < landmarks[2].y - 0.03;
        const othersFolded = index.y > landmarks[6].y && middle.y > landmarks[10].y;
        if (thumbUp && othersFolded) return 'thumbsup';
        
        return 'none';
    }
    
    distance(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }
    
    processRightHand(landmarks) {
        const now = Date.now();
        if (now - State.lastGestureTime < State.gestureCooldown) return;
        
        const gesture = this.detectGesture(landmarks);
        if (gesture === 'none') return;
        
        State.currentGesture = gesture;
        State.lastGestureTime = now;
        
        // Get hand position in 3D space
        const wrist = landmarks[0];
        const x = (wrist.x - 0.5) * 4;
        const y = (0.5 - wrist.y) * 4 + 1;
        const z = (wrist.z - 0.5) * 4;
        
        // Grow tree only if left hand is present (stable)
        if (gesture === 'point' && State.leftHand) {
            this.three.growTree();
            State.seedCount++;
            this.three.updateCounters();
            this.showActionFeedback('🌱 branch growing');
        }
        
        if (gesture === 'pinch') {
            this.three.bloomFlower(x, y, z);
            this.showActionFeedback('🌸 flower bloomed');
        }
        
        if (gesture === 'wave') {
            this.three.createMagicWind();
            this.showActionFeedback('🌀 magic wind');
        }
        
        if (gesture === 'peace') {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => this.three.createButterfly(), i * 300);
            }
            this.showActionFeedback('🦋 butterflies summoned');
        }
        
        if (gesture === 'thumbsup') {
            this.three.createGlow();
            this.showActionFeedback('✨ glowing magic');
        }
    }
    
    processBothHands(left, right) {
        const now = Date.now();
        if (now - State.lastGestureTime < State.gestureCooldown) return;
        
        // Check if hands are close together
        const leftWrist = left[0];
        const rightWrist = right[0];
        const dist = this.distance(leftWrist, rightWrist);
        
        if (dist < 0.2 && !State.isRevealed) {
            State.lastGestureTime = now;
            this.three.createMagicBurst();
            this.showActionFeedback('🎉 MAGIC BURST!');
            State.isRevealed = true;
        }
    }
    
    resetGestures() {
        State.currentGesture = 'none';
    }
    
    showActionFeedback(text) {
        const hint = State.elements.actionHint;
        hint.textContent = text;
        hint.style.color = '#f7d44a';
        clearTimeout(this.feedbackTimeout);
        this.feedbackTimeout = setTimeout(() => {
            hint.textContent = '✦ use right hand for magic ✦';
            hint.style.color = 'rgba(255,255,255,0.5)';
        }, 1500);
    }
}

// ============================================
// BEGIN MANAGER
// ============================================
class BeginManager {
    constructor(threeManager) {
        this.three = threeManager;
        this.beginScreen = State.elements.beginScreen;
        this.beginButton = State.elements.beginButton;
        this.loadingScreen = State.elements.loadingScreen;
        
        this.beginButton.addEventListener('click', () => {
            this.startExperience();
        });
        
        setTimeout(() => this.showBeginScreen(), 1500);
    }
    
    showBeginScreen() {
        this.loadingScreen.classList.add('hidden');
        setTimeout(() => {
            this.beginScreen.classList.add('visible');
            gsap.from('.begin-container', {
                scale: 0.9,
                opacity: 0,
                duration: 1,
                ease: 'back.out(1.7)'
            });
        }, 400);
    }
    
    startExperience() {
        this.beginScreen.classList.remove('visible');
        this.beginScreen.style.display = 'none';
        
        const handTracking = new HandTrackingManager(this.three);
        handTracking.initialize();
        
        console.log('✦ Experience started ✦');
    }
}

// ============================================
// MAIN APPLICATION
// ============================================
class Application {
    constructor() {
        console.log('🌸 Interactive Birthday Experience');
        console.log('✦ Both hands tracking + 6 gestures ✦');
        
        cacheElements();
        
        this.three = new ThreeManager();
        this.begin = new BeginManager(this.three);
        
        console.log('✅ Application ready');
    }
}

// ============================================
// START
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.app = new Application();
});

console.log('🚀 Interactive Birthday Experience loaded');
console.log('📖 Gesture Guide:');
console.log('  ☝️ Point → Grow branch');
console.log('  🤏 Pinch → Bloom flower');
console.log('  👋 Wave → Magic wind');
console.log('  ✌️ Peace → Butterflies');
console.log('  👍 Thumbs up → Glow');
console.log('  🤲 Both hands → Magic Burst + Birthday Reveal');

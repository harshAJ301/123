/**
 * ============================================
 * MAGICAL BIRTHDAY EXPERIENCE - ENHANCED
 * Full Interactive Version with Hand Tracking
 * ============================================
 */

// ============================================
// APPLICATION STATE
// ============================================
const AppState = {
    isReady: false,
    isTracking: false,
    seedCount: 0,
    flowerCount: 0,
    butterflyCount: 0,
    scene: null,
    camera: null,
    renderer: null,
    handLandmarks: null,
    gestures: {
        pinch: false,
        wave: false,
        point: false,
        pinchStart: null,
        waveStart: null
    },
    // Performance settings
    settings: {
        maxParticles: 500,
        maxFlowers: 50,
        maxButterflies: 30,
        enableShadows: true,
        quality: 'high'
    },
    // Visual feedback elements
    feedback: {
        cursor: null,
        glow: null,
        particles: []
    }
};

// ============================================
// THREE.JS SCENE MANAGER
// ============================================
class SceneManager {
    constructor() {
        this.container = document.getElementById('app');
        this.canvas = document.getElementById('three-canvas');
        
        // Initialize Three.js
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.002);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Store in state
        AppState.scene = this.scene;
        AppState.camera = this.camera;
        AppState.renderer = this.renderer;
        
        // Setup
        this.setupLighting();
        this.setupBackgroundParticles();
        this.setupEventListeners();
        this.animate();
        
        console.log('🎨 Scene initialized');
    }
    
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x222244, 0.4);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffeedd, 1.2);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);
        
        const fillLight = new THREE.DirectionalLight(0x4444ff, 0.4);
        fillLight.position.set(-5, 0, 5);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0x8855ff, 0.3);
        rimLight.position.set(0, -5, -5);
        this.scene.add(rimLight);
        
        const pointLight = new THREE.PointLight(0xff6b9d, 0.5, 20);
        pointLight.position.set(0, 3, 0);
        this.scene.add(pointLight);
        
        this.lights = { mainLight, fillLight, rimLight, pointLight };
    }
    
    setupBackgroundParticles() {
        const geometry = new THREE.BufferGeometry();
        const count = 300;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = Math.random() * 8 - 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
            
            const color = new THREE.Color().setHSL(0.6 + Math.random() * 0.3, 0.5, 0.3 + Math.random() * 0.2);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.03,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });
        
        this.backgroundParticles = new THREE.Points(geometry, material);
        this.scene.add(this.backgroundParticles);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate background particles slowly
        if (this.backgroundParticles) {
            this.backgroundParticles.rotation.y += 0.0005;
            this.backgroundParticles.rotation.x += 0.0002;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================
// HAND TRACKING MANAGER (MediaPipe)
// ============================================
class HandTrackingManager {
    constructor() {
        this.canvas = document.getElementById('hand-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isInitialized = false;
        this.video = null;
        this.hands = null;
        this.camera = null;
        this.lastPinchTime = 0;
        this.lastWaveTime = 0;
        this.pinchCooldown = 500; // ms
        this.waveCooldown = 1000; // ms
        
        // Setup canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize
        this.initializeMediaPipe();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    async initializeMediaPipe() {
        try {
            // Show status
            this.updateLoadingStatus('📷 Requesting camera access...');
            
            // Create video element
            this.video = document.createElement('video');
            this.video.style.display = 'none';
            document.body.appendChild(this.video);
            
            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });
            
            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6
            });
            
            this.hands.onResults((results) => {
                this.handleResults(results);
            });
            
            // Start camera
            this.updateLoadingStatus('🎥 Starting camera...');
            
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    try {
                        await this.hands.send({ image: this.video });
                    } catch (e) {
                        // Silently handle frame errors
                    }
                },
                width: 640,
                height: 480
            });
            
            await this.camera.start();
            
            this.isInitialized = true;
            AppState.isTracking = true;
            
            this.updateLoadingStatus('✨ Ready! Show your hand to the camera');
            
            // Hide loading screen after delay
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 1000);
            
            console.log('✨ Hand tracking initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize hand tracking:', error);
            this.updateLoadingStatus('❌ Camera error. Click to retry.');
            this.showFallbackUI();
        }
    }
    
    updateLoadingStatus(text) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const textEl = loadingScreen.querySelector('.loading-text');
            if (textEl) {
                textEl.textContent = text;
            }
        }
    }
    
    handleResults(results) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw hand with enhanced visuals
            this.drawHandEnhanced(landmarks);
            
            // Process gestures
            this.processGestures(landmarks);
            
            // Update cursor position
            this.updateCursor(landmarks);
            
            // Store landmarks
            AppState.handLandmarks = landmarks;
            
            // Update instruction steps
            this.updateInstructions(true);
        } else {
            AppState.handLandmarks = null;
            this.resetGestures();
            this.updateInstructions(false);
            
            // Reset cursor
            if (AppState.feedback.cursor) {
                AppState.feedback.cursor.style.opacity = '0';
            }
        }
    }
    
    drawHandEnhanced(landmarks) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Connection map
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
        ];
        
        // Glow effect for connections
        this.ctx.shadowColor = 'rgba(247, 212, 74, 0.3)';
        this.ctx.shadowBlur = 10;
        
        // Draw connections with gradient
        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            
            const gradient = this.ctx.createLinearGradient(
                p1.x * width, p1.y * height,
                p2.x * width, p2.y * height
            );
            gradient.addColorStop(0, 'rgba(247, 212, 74, 0.4)');
            gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x * width, p1.y * height);
            this.ctx.lineTo(p2.x * width, p2.y * height);
            this.ctx.stroke();
        });
        
        this.ctx.shadowBlur = 0;
        
        // Draw landmarks with glow
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * width;
            const y = landmark.y * height;
            
            // Finger colors
            const fingerColors = [
                '#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'
            ];
            const fingerIndex = Math.floor(index / 4);
            const color = fingerColors[fingerIndex % fingerColors.length];
            
            // Outer glow
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 15);
            gradient.addColorStop(0, color + '80');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core dot
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        // Draw pinch indicator if pinching
        if (AppState.gestures.pinch) {
            const thumb = landmarks[4];
            const index = landmarks[8];
            const cx = (thumb.x + index.x) / 2 * width;
            const cy = (thumb.y + index.y) / 2 * height;
            
            // Ripple effect
            const ripple = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
            ripple.addColorStop(0, 'rgba(247, 212, 74, 0.8)');
            ripple.addColorStop(0.5, 'rgba(255, 107, 157, 0.4)');
            ripple.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = ripple;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    processGestures(landmarks) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        
        // Calculate pinch distance
        const pinchDistance = this.distance(thumbTip, indexTip);
        const isPinching = pinchDistance < 0.04;
        
        // Pinch detection with cooldown
        const now = Date.now();
        if (isPinching && !AppState.gestures.pinch && now - this.lastPinchTime > this.pinchCooldown) {
            this.onPinch(landmarks);
            this.lastPinchTime = now;
        }
        AppState.gestures.pinch = isPinching;
        
        // Wave detection
        const waveHeight = this.getWaveHeight(landmarks);
        const isWaving = waveHeight > 0.12;
        
        if (isWaving && !AppState.gestures.wave && now - this.lastWaveTime > this.waveCooldown) {
            this.onWave(landmarks);
            this.lastWaveTime = now;
        }
        AppState.gestures.wave = isWaving;
    }
    
    distance(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }
    
    getWaveHeight(landmarks) {
        let heights = [];
        for (let i = 5; i < 21; i += 4) {
            heights.push(landmarks[i].y);
        }
        return Math.max(...heights) - Math.min(...heights);
    }
    
    resetGestures() {
        AppState.gestures.pinch = false;
        AppState.gestures.wave = false;
    }
    
    onPinch(landmarks) {
        console.log('🌱 Pinch detected! Planting seed...');
        AppState.seedCount++;
        document.getElementById('seed-count').textContent = AppState.seedCount;
        AppState.flowerCount++;
        document.getElementById('flower-count').textContent = AppState.flowerCount;
        
        // Show action hint
        const hint = document.getElementById('action-hint');
        hint.textContent = '🌱 Seed planted! Watch it grow! ✨';
        hint.style.opacity = '1';
        hint.style.color = '#f7d44a';
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            hint.style.opacity = '0';
        }, 2500);
        
        // Create burst effect
        const wrist = landmarks[0];
        const x = wrist.x * window.innerWidth;
        const y = wrist.y * window.innerHeight;
        this.createBurstEffect(x, y, '#f7d44a', 30);
        
        // Create seed particles
        this.createSeedParticles(x, y);
    }
    
    onWave(landmarks) {
        console.log('🦋 Wave detected! Attracting butterflies...');
        AppState.butterflyCount++;
        document.getElementById('butterfly-count').textContent = AppState.butterflyCount;
        
        // Show action hint
        const hint = document.getElementById('action-hint');
        hint.textContent = '🦋 Butterflies are coming!';
        hint.style.opacity = '1';
        hint.style.color = '#ff6b9d';
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            hint.style.opacity = '0';
        }, 2500);
        
        // Create burst effect
        const wrist = landmarks[0];
        const x = wrist.x * window.innerWidth;
        const y = wrist.y * window.innerHeight;
        this.createBurstEffect(x, y, '#ff6b9d', 40);
        
        // Create butterfly particles
        this.createButterflyParticles(x, y);
    }
    
    createBurstEffect(x, y, color, count = 20) {
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 150;
            const size = 4 + Math.random() * 8;
            const duration = 600 + Math.random() * 400;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                pointer-events: none;
                z-index: 100;
                opacity: 1;
                transform: translate(0, 0) scale(1);
                transition: all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            document.body.appendChild(particle);
            
            // Animate
            requestAnimationFrame(() => {
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;
                particle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
                particle.style.opacity = '0';
            });
            
            setTimeout(() => {
                particle.remove();
            }, duration + 100);
        }
    }
    
    createSeedParticles(x, y) {
        // Create floating seed emojis
        for (let i = 0; i < 5; i++) {
            const seed = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 60;
            
            seed.textContent = '🌱';
            seed.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                font-size: ${20 + Math.random() * 20}px;
                pointer-events: none;
                z-index: 100;
                opacity: 1;
                transform: translate(0, 0) scale(0);
                transition: all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            document.body.appendChild(seed);
            
            requestAnimationFrame(() => {
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance - 50;
                seed.style.transform = `translate(${dx}px, ${dy}px) scale(1)`;
                seed.style.opacity = '0';
            });
            
            setTimeout(() => {
                seed.remove();
            }, 2000);
        }
    }
    
    createButterflyParticles(x, y) {
        const emojis = ['🦋', '✨', '🌸', '🦋', '✨'];
        
        for (let i = 0; i < 8; i++) {
            const element = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 100;
            
            element.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            element.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                font-size: ${24 + Math.random() * 30}px;
                pointer-events: none;
                z-index: 100;
                opacity: 1;
                transform: translate(0, 0) rotate(0deg) scale(0);
                transition: all 1.8s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            document.body.appendChild(element);
            
            requestAnimationFrame(() => {
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance - 30 + Math.random() * 60;
                const rotation = Math.random() * 720 - 360;
                element.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation}deg) scale(1)`;
                element.style.opacity = '0';
            });
            
            setTimeout(() => {
                element.remove();
            }, 2200);
        }
    }
    
    updateCursor(landmarks) {
        const wrist = landmarks[0];
        const x = wrist.x * window.innerWidth;
        const y = wrist.y * window.innerHeight;
        
        let cursor = AppState.feedback.cursor;
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.style.cssText = `
                position: fixed;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(247, 212, 74, 0.6), transparent);
                pointer-events: none;
                z-index: 50;
                transform: translate(-50%, -50%);
                transition: all 0.1s ease;
                box-shadow: 0 0 30px rgba(247, 212, 74, 0.3);
            `;
            document.body.appendChild(cursor);
            AppState.feedback.cursor = cursor;
        }
        
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        cursor.style.opacity = '0.8';
        
        // Scale based on pinch
        if (AppState.gestures.pinch) {
            cursor.style.transform = 'translate(-50%, -50%) scale(0.5)';
            cursor.style.background = 'radial-gradient(circle, rgba(255, 107, 157, 0.8), transparent)';
            cursor.style.boxShadow = '0 0 40px rgba(255, 107, 157, 0.5)';
        } else {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.background = 'radial-gradient(circle, rgba(247, 212, 74, 0.6), transparent)';
            cursor.style.boxShadow = '0 0 30px rgba(247, 212, 74, 0.3)';
        }
    }
    
    updateInstructions(handDetected) {
        const steps = document.querySelectorAll('.instruction-step');
        if (handDetected) {
            steps.forEach((step, index) => {
                if (index === 0) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });
        } else {
            steps.forEach(step => step.classList.remove('active'));
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                AppState.isReady = true;
                console.log('🎉 Magic is ready!');
            }, 800);
        }
    }
    
    showFallbackUI() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
                    <div style="font-size: 4rem; margin-bottom: 24px;">📷</div>
                    <h2 style="color: var(--text-primary); margin-bottom: 16px; font-size: 1.5rem;">
                        Camera Access Required
                    </h2>
                    <p style="max-width: 400px; margin: 0 auto 24px; line-height: 1.6;">
                        Please allow camera access to enable the magical hand-tracking experience.
                        <br><br>
                        <span style="font-size: 0.9rem; opacity: 0.7;">
                            💡 Tip: Use Chrome or Edge for best results
                        </span>
                    </p>
                    <button onclick="location.reload()" style="
                        background: linear-gradient(135deg, #f7d44a, #ff6b9d);
                        color: #0a0a0f;
                        border: none;
                        padding: 12px 32px;
                        border-radius: 50px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                        box-shadow: 0 4px 20px rgba(247, 212, 74, 0.3);
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
                    >🔄 Retry</button>
                </div>
            `;
        }
    }
}

// ============================================
// MAIN APPLICATION
// ============================================
class Application {
    constructor() {
        console.log('🎂 Initializing Magical Birthday Experience...');
        
        // Initialize Three.js Scene
        this.sceneManager = new SceneManager();
        
        // Initialize Hand Tracking
        this.handTracking = new HandTrackingManager();
        
        console.log('✨ Application ready!');
    }
}

// ============================================
// START
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.app = new Application();
});

// ============================================
// DYNAMIC STYLES
// ============================================
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes seed-burst {
        0% { transform: scale(0); opacity: 1; }
        50% { transform: scale(3); opacity: 0.8; }
        100% { transform: scale(5); opacity: 0; }
    }
    
    @keyframes float-up {
        0% { transform: translateY(0) scale(0); opacity: 1; }
        100% { transform: translateY(-100px) scale(1); opacity: 0; }
    }
`;
document.head.appendChild(styleSheet);

console.log('🎉 Magical Birthday Experience loaded successfully!');

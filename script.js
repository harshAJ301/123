/**
 * ============================================
 * DIGITAL FLOWERS - FULL EXPERIENCE
 * Camera + Hand Tracking + Poetry + Controls
 * ============================================
 */

// ============================================
// APPLICATION STATE
// ============================================
const AppState = {
    isReady: false,
    isTracking: false,
    flowerCount: 2229,
    seedCount: 31,
    bloom: 0.35,
    grow: 0.30,
    handLandmarks: null,
    gestures: { pinch: false, wave: false },
    feedback: { cursor: null }
};

// ============================================
// THREE.JS BACKGROUND EFFECTS
// ============================================
class ThreeManager {
    constructor() {
        this.canvas = document.getElementById('three-canvas');
        
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
        
        this.setupParticles();
        this.animate();
        this.handleResize();
    }
    
    setupParticles() {
        const geometry = new THREE.BufferGeometry();
        const count = 200;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10 + 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
            sizes[i] = 0.01 + Math.random() * 0.03;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0xa855f7,
            size: 0.04,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.particles) {
            this.particles.rotation.y += 0.001;
            this.particles.rotation.x += 0.0003;
        }
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }
}

// ============================================
// HAND TRACKING MANAGER
// ============================================
class HandTrackingManager {
    constructor() {
        this.canvas = document.getElementById('hand-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.video = document.getElementById('camera-feed');
        this.lastPinchTime = 0;
        this.lastWaveTime = 0;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.initializeCameraAndTracking();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    async initializeCameraAndTracking() {
        try {
            this.updateLoading('✦ starting camera ✦');
            
            // Start camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            this.video.srcObject = stream;
            await this.video.play();
            
            this.updateLoading('✦ loading hand tracking ✦');
            
            // Initialize MediaPipe
            const hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });
            
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6
            });
            
            hands.onResults((results) => this.handleResults(results));
            
            const camera = new Camera(this.video, {
                onFrame: async () => {
                    try { await hands.send({ image: this.video }); } 
                    catch (e) {}
                },
                width: 640,
                height: 480
            });
            
            await camera.start();
            
            this.updateLoading('✦ ready ✦');
            setTimeout(() => this.hideLoading(), 800);
            
            console.log('✦ Hand tracking ready ✦');
            
        } catch (error) {
            console.error('❌ Camera error:', error);
            this.showFallbackUI();
        }
    }
    
    updateLoading(text) {
        const el = document.querySelector('.loading-text');
        if (el) el.textContent = text;
    }
    
    hideLoading() {
        const screen = document.getElementById('loading-screen');
        if (screen) {
            screen.classList.add('hidden');
            setTimeout(() => {
                screen.style.display = 'none';
                AppState.isReady = true;
            }, 800);
        }
    }
    
    showFallbackUI() {
        const screen = document.getElementById('loading-screen');
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
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            this.drawHand(landmarks);
            this.processGestures(landmarks);
            this.updateCursor(landmarks);
            AppState.handLandmarks = landmarks;
            
            const hint = document.getElementById('action-hint');
            hint.textContent = '✦ hand detected • try gestures ✦';
            hint.style.color = 'rgba(255,255,255,0.8)';
        } else {
            AppState.handLandmarks = null;
            const hint = document.getElementById('action-hint');
            hint.textContent = '✦ show your hand to the camera ✦';
            hint.style.color = 'rgba(255,255,255,0.4)';
            
            if (AppState.feedback.cursor) {
                AppState.feedback.cursor.style.opacity = '0';
            }
        }
    }
    
    drawHand(landmarks) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Connections
        const connections = [
            [0,1],[1,2],[2,3],[3,4],
            [0,5],[5,6],[6,7],[7,8],
            [0,9],[9,10],[10,11],[11,12],
            [0,13],[13,14],[14,15],[15,16],
            [0,17],[17,18],[18,19],[19,20],
            [5,9],[9,13],[13,17]
        ];
        
        // Draw connections
        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            
            this.ctx.shadowColor = 'rgba(247, 212, 74, 0.15)';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = 'rgba(247, 212, 74, 0.25)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x * w, p1.y * h);
            this.ctx.lineTo(p2.x * w, p2.y * h);
            this.ctx.stroke();
        });
        
        this.ctx.shadowBlur = 0;
        
        // Draw landmarks
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * w;
            const y = landmark.y * h;
            const color = colors[Math.floor(index / 4) % colors.length];
            
            // Glow
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 12);
            gradient.addColorStop(0, color + '40');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Dot
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = color + '80';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        // Pinch indicator
        if (AppState.gestures.pinch) {
            const thumb = landmarks[4];
            const index = landmarks[8];
            const cx = (thumb.x + index.x) / 2 * w;
            const cy = (thumb.y + index.y) / 2 * h;
            
            this.ctx.strokeStyle = 'rgba(247, 212, 74, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 25, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = 'rgba(255, 107, 157, 0.1)';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 40, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    processGestures(landmarks) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        const now = Date.now();
        
        // Pinch detection
        const distance = Math.sqrt(
            Math.pow(thumb.x - index.x, 2) +
            Math.pow(thumb.y - index.y, 2) +
            Math.pow(thumb.z - index.z, 2)
        );
        const isPinching = distance < 0.04;
        
        if (isPinching && !AppState.gestures.pinch && now - this.lastPinchTime > 500) {
            this.onPinch();
            this.lastPinchTime = now;
        }
        AppState.gestures.pinch = isPinching;
        
        // Wave detection
        let heights = [];
        for (let i = 5; i < 21; i += 4) {
            heights.push(landmarks[i].y);
        }
        const waveHeight = Math.max(...heights) - Math.min(...heights);
        const isWaving = waveHeight > 0.12;
        
        if (isWaving && !AppState.gestures.wave && now - this.lastWaveTime > 1000) {
            this.onWave();
            this.lastWaveTime = now;
        }
        AppState.gestures.wave = isWaving;
    }
    
    onPinch() {
        AppState.seedCount++;
        AppState.flowerCount++;
        
        document.getElementById('seed-counter').textContent = AppState.seedCount.toLocaleString();
        document.getElementById('flower-counter').textContent = AppState.flowerCount.toLocaleString();
        
        const hint = document.getElementById('action-hint');
        hint.textContent = '✦ flower planted ✦';
        hint.style.color = '#f7d44a';
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            hint.textContent = '✦ pinch to plant a flower ✦';
            hint.style.color = 'rgba(255,255,255,0.4)';
        }, 1500);
        
        this.createBurst('#f7d44a', 15);
    }
    
    onWave() {
        const hint = document.getElementById('action-hint');
        hint.textContent = '✦ butterflies dancing ✦';
        hint.style.color = '#ff6b9d';
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            hint.textContent = '✦ wave to attract butterflies ✦';
            hint.style.color = 'rgba(255,255,255,0.4)';
        }, 1500);
        
        this.createBurst('#ff6b9d', 20);
    }
    
    createBurst(color, count = 15) {
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 80;
            const size = 3 + Math.random() * 6;
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
                z-index: 50;
                opacity: 0.8;
                transform: translate(0, 0) scale(1);
                transition: all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            document.body.appendChild(particle);
            
            requestAnimationFrame(() => {
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance - 30;
                particle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
                particle.style.opacity = '0';
            });
            
            setTimeout(() => particle.remove(), duration + 100);
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
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 1px solid rgba(247, 212, 74, 0.15);
                pointer-events: none;
                z-index: 3;
                transform: translate(-50%, -50%);
                transition: all 0.15s ease;
                background: radial-gradient(circle, rgba(247, 212, 74, 0.05), transparent);
            `;
            document.body.appendChild(cursor);
            AppState.feedback.cursor = cursor;
        }
        
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        cursor.style.opacity = '0.6';
        
        if (AppState.gestures.pinch) {
            cursor.style.transform = 'translate(-50%, -50%) scale(0.3)';
            cursor.style.borderColor = 'rgba(255, 107, 157, 0.3)';
            cursor.style.background = 'radial-gradient(circle, rgba(255, 107, 157, 0.1), transparent)';
        } else {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.borderColor = 'rgba(247, 212, 74, 0.15)';
            cursor.style.background = 'radial-gradient(circle, rgba(247, 212, 74, 0.05), transparent)';
        }
    }
}

// ============================================
// CONTROLS MANAGER
// ============================================
class ControlsManager {
    constructor() {
        this.bloomValue = 0.35;
        this.growValue = 0.30;
        this.startAnimations();
        this.setupInteractiveControls();
    }
    
    startAnimations() {
        // Animate bloom value
        this.animateValue('bloom-value', 0.35);
        this.animateValue('grow-value', 0.30);
        
        // Animate counters
        this.animateCounter('flower-counter', 2229);
        this.animateCounter('seed-counter', 31);
    }
    
    animateValue(elementId, target) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let current = 0;
        const duration = 2000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = eased * target;
            
            element.textContent = value.toFixed(2);
            
            if (progress < 1) requestAnimationFrame(animate);
        };
        animate();
    }
    
    animateCounter(elementId, target) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let current = 0;
        const duration = 3000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.floor(eased * target);
            
            element.textContent = value.toLocaleString();
            
            if (progress < 1) requestAnimationFrame(animate);
        };
        animate();
    }
    
    setupInteractiveControls() {
        // Make controls interactive - this will be expanded in future phases
        console.log('✦ Controls ready ✦');
    }
}

// ============================================
// BEGIN EXPERIENCE MANAGER
// ============================================
class BeginManager {
    constructor() {
        this.beginScreen = document.getElementById('begin-screen');
        this.beginButton = document.getElementById('begin-button');
        this.loadingScreen = document.getElementById('loading-screen');
        
        this.beginButton.addEventListener('click', () => {
            this.startExperience();
        });
        
        // Show begin screen after loading
        this.showBeginScreen();
    }
    
    showBeginScreen() {
        // Hide loading screen
        this.loadingScreen.classList.add('hidden');
        
        // Show begin screen
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
        
        // The camera and hand tracking are already running
        // Just show the main experience
        console.log('✦ Experience started ✦');
    }
}

// ============================================
// INITIALIZE APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Start Three.js
    const three = new ThreeManager();
    
    // Start Hand Tracking
    const handTracking = new HandTrackingManager();
    
    // Start Controls
    const controls = new ControlsManager();
    
    // Start Begin Experience
    const begin = new BeginManager();
    
    console.log('🌸 Digital Flowers ready!');
    console.log('✦ Full camera + hand tracking + poetry ✦');
});

console.log('✦ How I would send her flowers, but she didn\'t exist ✦');

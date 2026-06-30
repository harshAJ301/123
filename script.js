/**
 * ============================================
 * MAGICAL BIRTHDAY GARDEN
 * Camera + Hand Tracking + Controls
 * ============================================
 */

// ============================================
// STATE
// ============================================
const AppState = {
    isReady: false,
    isTracking: false,
    seedCount: 0,
    flowerCount: 0,
    butterflyCount: 0,
    bloom: 0.35,
    grow: 0.30,
    handLandmarks: null,
    gestures: { pinch: false, wave: false },
    feedback: { cursor: null }
};

// ============================================
// THREE.JS SCENE
// ============================================
class SceneManager {
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
        
        AppState.scene = this.scene;
        AppState.camera = this.camera;
        AppState.renderer = this.renderer;
        
        this.setupScene();
        this.animate();
    }
    
    setupScene() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(5, 10, 7);
        this.scene.add(light);
        
        // Floating particles
        const geometry = new THREE.BufferGeometry();
        const count = 150;
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
            size: 0.03,
            transparent: true,
            opacity: 0.4,
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
}

// ============================================
// HAND TRACKING
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
        
        this.initializeMediaPipe();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    async initializeMediaPipe() {
        try {
            this.updateLoading('📷 Starting camera...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            this.video.srcObject = stream;
            await this.video.play();
            
            this.updateLoading('👋 Loading hand tracking...');
            
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
                    try {
                        await hands.send({ image: this.video });
                    } catch (e) {}
                },
                width: 640,
                height: 480
            });
            
            await camera.start();
            
            this.updateLoading('✨ Ready! Show your hand');
            setTimeout(() => this.hideLoading(), 1000);
            
            console.log('✨ Hand tracking ready!');
            
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
            screen.classList.add('fade-out');
            setTimeout(() => {
                screen.style.display = 'none';
                AppState.isReady = true;
                document.getElementById('action-hint').textContent = '👋 Show your hand to start';
            }, 800);
        }
    }
    
    showFallbackUI() {
        const screen = document.getElementById('loading-screen');
        if (screen) {
            screen.innerHTML = `
                <div style="text-align:center;color:white;padding:20px;">
                    <div style="font-size:4rem;margin-bottom:20px;">📷</div>
                    <h2 style="margin-bottom:12px;">Camera Access Required</h2>
                    <p style="max-width:400px;margin:0 auto 20px;color:rgba(255,255,255,0.7);">
                        Please allow camera access for the magical experience.
                    </p>
                    <button onclick="location.reload()" style="
                        background:linear-gradient(135deg,#f7d44a,#ff6b9d);
                        border:none;padding:12px 32px;border-radius:50px;
                        font-size:1rem;font-weight:600;cursor:pointer;
                        color:white;
                    ">🔄 Retry</button>
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
            document.getElementById('action-hint').textContent = '✨ Hand detected! Try gestures!';
        } else {
            AppState.handLandmarks = null;
            document.getElementById('action-hint').textContent = '👋 Show your hand to start';
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
        
        // Draw connections with glow
        this.ctx.shadowColor = 'rgba(247, 212, 74, 0.3)';
        this.ctx.shadowBlur = 15;
        
        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x * w, p1.y * h);
            this.ctx.lineTo(p2.x * w, p2.y * h);
            this.ctx.strokeStyle = 'rgba(247, 212, 74, 0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        
        this.ctx.shadowBlur = 0;
        
        // Draw landmarks
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * w;
            const y = landmark.y * h;
            const fingerIndex = Math.floor(index / 4);
            const color = colors[fingerIndex % colors.length];
            
            // Glow
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 15);
            gradient.addColorStop(0, color + '80');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        // Pinch indicator
        if (AppState.gestures.pinch) {
            const thumb = landmarks[4];
            const index = landmarks[8];
            const cx = (thumb.x + index.x) / 2 * w;
            const cy = (thumb.y + index.y) / 2 * h;
            
            const ripple = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
            ripple.addColorStop(0, 'rgba(247, 212, 74, 0.8)');
            ripple.addColorStop(0.5, 'rgba(255, 107, 157, 0.4)');
            ripple.addColorStop(1, 'transparent');
            this.ctx.fillStyle = ripple;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 40, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    processGestures(landmarks) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        const now = Date.now();
        
        // Pinch
        const distance = Math.sqrt(
            Math.pow(thumb.x - index.x, 2) +
            Math.pow(thumb.y - index.y, 2) +
            Math.pow(thumb.z - index.z, 2)
        );
        const isPinching = distance < 0.04;
        
        if (isPinching && !AppState.gestures.pinch && now - this.lastPinchTime > 500) {
            this.onPinch(landmarks);
            this.lastPinchTime = now;
        }
        AppState.gestures.pinch = isPinching;
        
        // Wave
        let heights = [];
        for (let i = 5; i < 21; i += 4) {
            heights.push(landmarks[i].y);
        }
        const waveHeight = Math.max(...heights) - Math.min(...heights);
        const isWaving = waveHeight > 0.12;
        
        if (isWaving && !AppState.gestures.wave && now - this.lastWaveTime > 1000) {
            this.onWave(landmarks);
            this.lastWaveTime = now;
        }
        AppState.gestures.wave = isWaving;
    }
    
    onPinch(landmarks) {
        AppState.seedCount++;
        AppState.flowerCount++;
        document.getElementById('seed-count').textContent = AppState.seedCount;
        document.getElementById('flower-count').textContent = AppState.flowerCount;
        
        this.showHint('🌱 Seed planted! Watch it grow! ✨', '#f7d44a');
        this.createBurst(landmarks, '#f7d44a', 25);
    }
    
    onWave(landmarks) {
        AppState.butterflyCount++;
        document.getElementById('butterfly-count').textContent = AppState.butterflyCount;
        
        this.showHint('🦋 Butterflies are coming!', '#ff6b9d');
        this.createBurst(landmarks, '#ff6b9d', 30);
    }
    
    showHint(text, color) {
        const hint = document.getElementById('action-hint');
        hint.textContent = text;
        hint.style.color = color;
        hint.style.borderColor = color;
        hint.style.opacity = '1';
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            hint.style.color = 'white';
            hint.style.borderColor = 'rgba(255,255,255,0.1)';
            hint.textContent = '✨ Try gestures!';
        }, 2000);
    }
    
    createBurst(landmarks, color, count = 20) {
        const wrist = landmarks[0];
        const x = wrist.x * window.innerWidth;
        const y = wrist.y * window.innerHeight;
        const colors = ['#f7d44a', '#ff6b9d', '#a855f7', '#3b82f6', '#06b6d4'];
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 120;
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
            
            requestAnimationFrame(() => {
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;
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
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(247, 212, 74, 0.6), transparent);
                pointer-events: none;
                z-index: 50;
                transform: translate(-50%, -50%);
                transition: all 0.1s ease;
                box-shadow: 0 0 40px rgba(247, 212, 74, 0.3);
            `;
            document.body.appendChild(cursor);
            AppState.feedback.cursor = cursor;
        }
        
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        cursor.style.opacity = '0.8';
        
        if (AppState.gestures.pinch) {
            cursor.style.transform = 'translate(-50%, -50%) scale(0.4)';
            cursor.style.background = 'radial-gradient(circle, rgba(255, 107, 157, 0.8), transparent)';
            cursor.style.boxShadow = '0 0 50px rgba(255, 107, 157, 0.5)';
        } else {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.background = 'radial-gradient(circle, rgba(247, 212, 74, 0.6), transparent)';
            cursor.style.boxShadow = '0 0 40px rgba(247, 212, 74, 0.3)';
        }
    }
}

// ============================================
// CONTROLS MANAGER
// ============================================
class ControlsManager {
    constructor() {
        this.setupBloomControl();
        this.setupGrowControl();
        this.setupButtons();
    }
    
    setupBloomControl() {
        const slider = document.getElementById('bloom-slider');
        const value = document.getElementById('bloom-value');
        
        slider.addEventListener('input', () => {
            AppState.bloom = parseFloat(slider.value);
            value.textContent = AppState.bloom.toFixed(2);
            
            // Visual feedback
            document.querySelector('.control-group:first-child .control-track span:last-child')
                .style.opacity = AppState.bloom;
            
            // Animate flowers based on bloom
            this.updateFlowers();
        });
    }
    
    setupGrowControl() {
        const slider = document.getElementById('grow-slider');
        const value = document.getElementById('grow-value');
        
        slider.addEventListener('input', () => {
            AppState.grow = parseFloat(slider.value);
            value.textContent = AppState.grow.toFixed(2);
            
            // Visual feedback
            document.querySelector('.control-group:last-child .control-track span:last-child')
                .style.opacity = AppState.grow;
            
            // Animate growth
            this.updateGrowth();
        });
    }
    
    setupButtons() {
        document.getElementById('send-message').addEventListener('click', () => {
            const message = document.getElementById('birthday-message').value;
            if (message.trim()) {
                this.createMessageEffect(message);
                document.getElementById('action-hint').textContent = '✨ Message planted!';
                document.getElementById('action-hint').style.color = '#a855f7';
                setTimeout(() => {
                    document.getElementById('action-hint').style.color = 'white';
                }, 2000);
            }
        });
        
        document.getElementById('clear-message').addEventListener('click', () => {
            document.getElementById('birthday-message').value = '';
            document.getElementById('action-hint').textContent = '🗑️ Message cleared';
            setTimeout(() => {
                document.getElementById('action-hint').textContent = '✨ Try gestures!';
            }, 1500);
        });
    }
    
    updateFlowers() {
        // This will be connected to flower system in later phases
        console.log('🌺 Bloom updated:', AppState.bloom);
    }
    
    updateGrowth() {
        // This will be connected to growth system in later phases
        console.log('🌿 Grow updated:', AppState.grow);
    }
    
    createMessageEffect(message) {
        // Create floating message particles
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const size = 16 + Math.random() * 24;
            
            particle.textContent = ['✨', '🌸', '🦋', '💝', '🎂', '⭐'][Math.floor(Math.random() * 6)];
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                font-size: ${size}px;
                pointer-events: none;
                z-index: 100;
                opacity: 0;
                transform: scale(0) rotate(0deg);
                transition: all 2s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            document.body.appendChild(particle);
            
            requestAnimationFrame(() => {
                particle.style.opacity = '1';
                particle.style.transform = `scale(1) rotate(${Math.random() * 720 - 360}deg)`;
                particle.style.top = (y - 100 - Math.random() * 200) + 'px';
            });
            
            setTimeout(() => {
                particle.style.opacity = '0';
                particle.style.transform = `scale(0) rotate(${Math.random() * 720}deg)`;
            }, 2000);
            
            setTimeout(() => particle.remove(), 2500);
        }
    }
}

// ============================================
// INITIALIZE APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const scene = new SceneManager();
    const handTracking = new HandTrackingManager();
    const controls = new ControlsManager();
    
    console.log('🌸 Magical Birthday Garden ready!');
});

// ============================================
// DYNAMIC STYLES
// ============================================
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .control-group:first-child .control-track span:last-child {
        opacity: 0.35;
        transition: opacity 0.3s ease;
    }
    .control-group:last-child .control-track span:last-child {
        opacity: 0.30;
        transition: opacity 0.3s ease;
    }
`;
document.head.appendChild(styleSheet);

console.log('🎉 Magical Birthday Garden loaded!');

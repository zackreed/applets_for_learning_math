/**
 * GradientDescentViz - Standalone Gradient Descent Visualization
 * 
 * A self-contained visualization of gradient descent for linear regression.
 * Shows parameter space, data view, and 3D error surface.
 * 
 * @example
 * const container = document.getElementById('viz-container');
 * const viz = new GradientDescentViz(container, {
 *   width: 1300,
 *   height: 750,
 *   learningRate: 0.01
 * });
 */

class GradientDescentViz {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        
        // Default options
        this.options = {
            width: options.width || 1300,
            height: options.height || 750,
            learningRate: options.learningRate || 0.01,
            numDataPoints: options.numDataPoints || 20,
            backgroundColor: options.backgroundColor || '#0a0e27',
            showControls: options.showControls !== false
        };
        
        // State
        this.dataPoints = [];
        this.m0 = 0;
        this.m1 = 1;
        this.learningRate = this.options.learningRate;
        this.path = [];
        this.isMouseDown = false;
        this.currentView = 'data';
        this.pathHistory = [];
        
        // Initialize
        this.init();
    }
    
    init() {
        // Create main container structure
        this.createHTML();
        this.setupCanvases();
        this.setupThree();
        this.setupEventListeners();
        this.generateData();
        this.draw();
    }
    
    createHTML() {
        this.container.innerHTML = `
            <style>
                .gd-viz-container {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: ${this.options.backgroundColor};
                    color: #e0e0e0;
                    padding: 20px;
                    border-radius: 8px;
                }
                .gd-viz-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .gd-viz-header h2 {
                    color: #4ecca3;
                    margin: 0 0 10px 0;
                }
                .gd-viz-canvas-row {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                    justify-content: center;
                }
                .gd-viz-canvas-container {
                    border: 2px solid #3a4a6b;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #16213e;
                }
                .gd-viz-canvas-label {
                    text-align: center;
                    font-weight: bold;
                    color: #00d9ff;
                    margin-top: 5px;
                    font-size: 14px;
                }
                .gd-viz-controls {
                    background: #16213e;
                    padding: 15px;
                    border-radius: 8px;
                    border: 2px solid #3a4a6b;
                }
                .gd-viz-control-group {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                }
                .gd-viz-button {
                    background: #4ecca3;
                    color: #0a0e27;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .gd-viz-button:hover {
                    background: #45b393;
                    transform: translateY(-1px);
                }
                .gd-viz-button.secondary {
                    background: #e94560;
                }
                .gd-viz-button.secondary:hover {
                    background: #d93550;
                }
                .gd-viz-slider {
                    flex: 1;
                    min-width: 150px;
                }
                .gd-viz-label {
                    color: #00d9ff;
                    font-weight: bold;
                    min-width: 80px;
                }
                .gd-viz-info {
                    display: flex;
                    gap: 20px;
                    margin-top: 12px;
                    flex-wrap: wrap;
                }
                .gd-viz-info-item {
                    background: #0a0e27;
                    padding: 8px 15px;
                    border-radius: 6px;
                    border: 1px solid #3a4a6b;
                    font-family: 'Courier New', monospace;
                }
                .gd-viz-info-label {
                    color: #f9d423;
                    font-size: 12px;
                }
                .gd-viz-info-value {
                    color: #4ecca3;
                    font-size: 16px;
                    font-weight: bold;
                }
                #gd-three-container {
                    border: 2px solid #3a4a6b;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #0a0e27;
                }
            </style>
            
            <div class="gd-viz-container">
                ${this.options.showControls ? `
                <div class="gd-viz-header">
                    <h2>Gradient Descent for Linear Regression</h2>
                    <p style="color: #aaa;">Drag the red point in parameter space to set initial values. Adjust learning rate and take steps.</p>
                </div>
                ` : ''}
                
                <div class="gd-viz-canvas-row">
                    <div>
                        <div class="gd-viz-canvas-container">
                            <canvas id="gd-param-canvas" width="600" height="600"></canvas>
                        </div>
                        <div class="gd-viz-canvas-label">Parameter Space (m_0, m_1)</div>
                    </div>
                    <div>
                        <div class="gd-viz-canvas-container" id="gd-right-container">
                            <canvas id="gd-data-canvas" width="600" height="600"></canvas>
                            <div id="gd-three-container" style="display: none; width: 600px; height: 600px;"></div>
                        </div>
                        <div class="gd-viz-canvas-label" id="gd-right-label">Data & Fit</div>
                    </div>
                </div>
                
                ${this.options.showControls ? `
                <div class="gd-viz-controls">
                    <div class="gd-viz-control-group">
                        <span class="gd-viz-label">Learning Rate alpha:</span>
                        <input type="range" id="gd-learning-rate" class="gd-viz-slider" 
                               min="0.005" max="1.0" step="0.005" value="${this.learningRate}">
                        <span id="gd-lr-value" style="color: #f9d423; font-weight: bold; min-width: 60px;">${this.learningRate.toFixed(3)}</span>
                        
                        <button id="gd-step-btn" class="gd-viz-button">Take 1 Step</button>
                        <button id="gd-steps-btn" class="gd-viz-button">Take 10 Steps</button>
                        <button id="gd-reset-path" class="gd-viz-button secondary">Reset Path</button>
                    </div>
                    
                    <div class="gd-viz-control-group">
                        <button id="gd-reset-pos" class="gd-viz-button secondary">Reset Position</button>
                        <button id="gd-new-data" class="gd-viz-button secondary">New Data</button>
                        <button id="gd-toggle-view" class="gd-viz-button">Toggle: Data / Error Surface</button>
                    </div>
                    
                    <div class="gd-viz-info">
                        <div class="gd-viz-info-item">
                            <div class="gd-viz-info-label">m_0 (intercept)</div>
                            <div class="gd-viz-info-value" id="gd-m0-value">${this.m0.toFixed(4)}</div>
                        </div>
                        <div class="gd-viz-info-item">
                            <div class="gd-viz-info-label">m_1 (slope)</div>
                            <div class="gd-viz-info-value" id="gd-m1-value">${this.m1.toFixed(4)}</div>
                        </div>
                        <div class="gd-viz-info-item">
                            <div class="gd-viz-info-label">Error (MSE)</div>
                            <div class="gd-viz-info-value" id="gd-error-value">${this.calculateLoss(this.m0, this.m1).toFixed(4)}</div>
                        </div>
                        <div class="gd-viz-info-item">
                            <div class="gd-viz-info-label">Steps taken</div>
                            <div class="gd-viz-info-value" id="gd-steps-value">0</div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    setupCanvases() {
        this.paramCanvas = document.getElementById('gd-param-canvas');
        this.dataCanvas = document.getElementById('gd-data-canvas');
        this.paramCtx = this.paramCanvas.getContext('2d');
        this.dataCtx = this.dataCanvas.getContext('2d');
    }
    
    setupThree() {
        // Import Three.js if not already loaded
        if (typeof THREE === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = () => this.initThree();
            document.head.appendChild(script);
        } else {
            this.initThree();
        }
    }
    
    initThree() {
        const container = document.getElementById('gd-three-container');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e27);
        
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.camera.position.set(8, 12, 8);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(600, 600);
        container.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);
        
        // Create loss surface
        this.createLossSurface();
        
        // Current point marker
        const markerGeom = new THREE.SphereGeometry(0.15, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xe94560 });
        this.currentMarker = new THREE.Mesh(markerGeom, markerMat);
        this.scene.add(this.currentMarker);
        
        // Path line
        this.pathLineMaterial = new THREE.LineBasicMaterial({ color: 0x4ecca3, linewidth: 2 });
        this.pathLineGeometry = new THREE.BufferGeometry();
        this.pathLine = new THREE.Line(this.pathLineGeometry, this.pathLineMaterial);
        this.scene.add(this.pathLine);
        
        // Mouse controls for rotation
        this.isRotating = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.rotationX = 0;
        this.rotationY = 0;
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            this.isRotating = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (this.isRotating) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                this.rotationY += deltaX * 0.01;
                this.rotationX += deltaY * 0.01;
                this.rotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotationX));
                this.updateCameraPosition();
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            this.isRotating = false;
        });
        
        this.renderer.domElement.addEventListener('mouseleave', () => {
            this.isRotating = false;
        });
        
        this.updateThreeScene();
    }
    
    createLossSurface() {
        const resolution = 50;
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        const colors = [];
        
        const m0Range = 6;
        const m1Range = 6;
        
        let minLoss = Infinity;
        let maxLoss = -Infinity;
        const lossValues = [];
        
        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const m0 = (i / resolution - 0.5) * m0Range;
                const m1 = (j / resolution - 0.5) * m1Range;
                const loss = this.calculateLoss(m0, m1);
                lossValues.push(loss);
                minLoss = Math.min(minLoss, loss);
                maxLoss = Math.max(maxLoss, loss);
            }
        }
        
        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const m0 = (i / resolution - 0.5) * m0Range;
                const m1 = (j / resolution - 0.5) * m1Range;
                const loss = lossValues[i * (resolution + 1) + j];
                const normalizedLoss = (loss - minLoss) / (maxLoss - minLoss);
                const height = normalizedLoss * 3;
                
                vertices.push(m0, height, m1);
                
                const color = new THREE.Color();
                color.setHSL(0.6 - normalizedLoss * 0.6, 0.8, 0.5);
                colors.push(color.r, color.g, color.b);
            }
        }
        
        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const a = i * (resolution + 1) + j;
                const b = a + 1;
                const c = a + resolution + 1;
                const d = c + 1;
                
                indices.push(a, b, c);
                indices.push(b, d, c);
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            shininess: 30,
            transparent: true,
            opacity: 0.9
        });
        
        this.lossSurface = new THREE.Mesh(geometry, material);
        this.scene.add(this.lossSurface);
    }
    
    updateCameraPosition() {
        const radius = 15;
        this.camera.position.x = radius * Math.cos(this.rotationX) * Math.sin(this.rotationY);
        this.camera.position.y = radius * Math.sin(this.rotationX) + 8;
        this.camera.position.z = radius * Math.cos(this.rotationX) * Math.cos(this.rotationY);
        this.camera.lookAt(0, 1.5, 0);
    }
    
    setupEventListeners() {
        if (!this.options.showControls) return;
        
        document.getElementById('gd-learning-rate').addEventListener('input', (e) => {
            this.learningRate = parseFloat(e.target.value);
            document.getElementById('gd-lr-value').textContent = this.learningRate.toFixed(3);
        });
        
        document.getElementById('gd-step-btn').addEventListener('click', () => {
            this.gradientDescentStep();
            this.draw();
        });
        
        document.getElementById('gd-steps-btn').addEventListener('click', () => {
            for (let i = 0; i < 10; i++) {
                this.gradientDescentStep();
            }
            this.draw();
        });
        
        document.getElementById('gd-reset-path').addEventListener('click', () => {
            this.pathHistory = [[this.m0, this.m1]];
            this.draw();
        });
        
        document.getElementById('gd-reset-pos').addEventListener('click', () => {
            this.m0 = Math.random() * 4 - 2;
            this.m1 = Math.random() * 4 - 2;
            this.pathHistory = [[this.m0, this.m1]];
            this.draw();
        });
        
        document.getElementById('gd-new-data').addEventListener('click', () => {
            this.generateData();
            this.draw();
        });
        
        document.getElementById('gd-toggle-view').addEventListener('click', () => {
            this.currentView = this.currentView === 'data' ? 'surface' : 'data';
            const dataCanvas = document.getElementById('gd-data-canvas');
            const threeContainer = document.getElementById('gd-three-container');
            const label = document.getElementById('gd-right-label');
            
            if (this.currentView === 'surface') {
                dataCanvas.style.display = 'none';
                threeContainer.style.display = 'block';
                label.textContent = 'Error Surface E(m_0, m_1)';
                this.updateThreeScene();
            } else {
                dataCanvas.style.display = 'block';
                threeContainer.style.display = 'none';
                label.textContent = 'Data & Fit';
            }
        });
        
        // Mouse dragging on parameter space
        this.paramCanvas.addEventListener('mousedown', (e) => {
            const rect = this.paramCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const m0Screen = this.toScreenX(this.m0);
            const m1Screen = this.toScreenY(this.m1);
            
            if (Math.abs(x - m0Screen) < 15 && Math.abs(y - m1Screen) < 15) {
                this.isMouseDown = true;
            }
        });
        
        this.paramCanvas.addEventListener('mousemove', (e) => {
            if (this.isMouseDown) {
                const rect = this.paramCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                this.m0 = this.fromScreenX(x);
                this.m1 = this.fromScreenY(y);
                this.pathHistory = [[this.m0, this.m1]];
                this.draw();
            }
        });
        
        this.paramCanvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
        
        this.paramCanvas.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
        });
    }
    
    generateData() {
        const trueM0 = Math.random() * 4 - 2;
        const trueM1 = Math.random() * 2 + 0.5;
        const n = this.options.numDataPoints;
        
        this.dataPoints = [];
        for (let i = 0; i < n; i++) {
            const x = Math.random() * 10 - 5;
            const noise = (Math.random() - 0.5) * 2;
            const y = trueM0 + trueM1 * x + noise;
            this.dataPoints.push({ x, y });
        }
        
        this.pathHistory = [[this.m0, this.m1]];
    }
    
    calculateLoss(m0, m1) {
        let sum = 0;
        for (const point of this.dataPoints) {
            const pred = m0 + m1 * point.x;
            const error = pred - point.y;
            sum += error * error;
        }
        return sum / this.dataPoints.length;
    }
    
    calculateGradient(m0, m1) {
        let gradM0 = 0;
        let gradM1 = 0;
        const n = this.dataPoints.length;
        
        for (const point of this.dataPoints) {
            const pred = m0 + m1 * point.x;
            const error = pred - point.y;
            gradM0 += 2 * error;
            gradM1 += 2 * error * point.x;
        }
        
        return {
            gradM0: gradM0 / n,
            gradM1: gradM1 / n
        };
    }
    
    gradientDescentStep() {
        const { gradM0, gradM1 } = this.calculateGradient(this.m0, this.m1);
        this.m0 -= this.learningRate * gradM0;
        this.m1 -= this.learningRate * gradM1;
        this.pathHistory.push([this.m0, this.m1]);
        
        if (this.currentView === 'surface') {
            this.updateThreeScene();
        }
    }
    
    draw() {
        this.drawParamSpace();
        if (this.currentView === 'data') {
            this.drawDataView();
        }
        this.updateInfo();
    }
    
    drawParamSpace() {
        const ctx = this.paramCtx;
        const canvas = this.paramCanvas;
        
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grid
        ctx.strokeStyle = '#1a2545';
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(this.toScreenX(i), 0);
            ctx.lineTo(this.toScreenX(i), canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, this.toScreenY(i));
            ctx.lineTo(canvas.width, this.toScreenY(i));
            ctx.stroke();
        }
        
        // Axes
        ctx.strokeStyle = '#3a4a6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.toScreenX(0), 0);
        ctx.lineTo(this.toScreenX(0), canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, this.toScreenY(0));
        ctx.lineTo(canvas.width, this.toScreenY(0));
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#00d9ff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('m_0', canvas.width - 30, this.toScreenY(0) - 10);
        ctx.fillText('m_1', this.toScreenX(0) + 10, 20);
        
        // Path history
        if (this.pathHistory.length > 1) {
            ctx.strokeStyle = '#4ecca3';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.toScreenX(this.pathHistory[0][0]), this.toScreenY(this.pathHistory[0][1]));
            for (let i = 1; i < this.pathHistory.length; i++) {
                ctx.lineTo(this.toScreenX(this.pathHistory[i][0]), this.toScreenY(this.pathHistory[i][1]));
            }
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = '#4ecca3';
            for (const [m0, m1] of this.pathHistory) {
                ctx.beginPath();
                ctx.arc(this.toScreenX(m0), this.toScreenY(m1), 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        // Gradient vector
        const { gradM0, gradM1 } = this.calculateGradient(this.m0, this.m1);
        const gradMag = Math.sqrt(gradM0 * gradM0 + gradM1 * gradM1);
        if (gradMag > 0.001) {
            const scale = 0.5;
            const arrowLen = Math.min(gradMag * scale, 2);
            const dx = -gradM0 / gradMag * arrowLen;
            const dy = -gradM1 / gradMag * arrowLen;
            
            const x1 = this.toScreenX(this.m0);
            const y1 = this.toScreenY(this.m1);
            const x2 = this.toScreenX(this.m0 + dx);
            const y2 = this.toScreenY(this.m1 + dy);
            
            ctx.strokeStyle = '#f9d423';
            ctx.fillStyle = '#f9d423';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // Arrowhead
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - 10 * Math.cos(angle - Math.PI/6), y2 - 10 * Math.sin(angle - Math.PI/6));
            ctx.lineTo(x2 - 10 * Math.cos(angle + Math.PI/6), y2 - 10 * Math.sin(angle + Math.PI/6));
            ctx.closePath();
            ctx.fill();
        }
        
        // Current point
        ctx.fillStyle = '#e94560';
        ctx.beginPath();
        ctx.arc(this.toScreenX(this.m0), this.toScreenY(this.m1), 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawDataView() {
        const ctx = this.dataCtx;
        const canvas = this.dataCanvas;
        
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Find data bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        for (const point of this.dataPoints) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        const padding = 0.2;
        const rangeX = maxX - minX;
        const rangeY = maxY - minY;
        minX -= rangeX * padding;
        maxX += rangeX * padding;
        minY -= rangeY * padding;
        maxY += rangeY * padding;
        
        const toScreenX = (x) => ((x - minX) / (maxX - minX)) * canvas.width;
        const toScreenY = (y) => canvas.height - ((y - minY) / (maxY - minY)) * canvas.height;
        
        // Grid
        ctx.strokeStyle = '#1a2545';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = minX + (maxX - minX) * i / 10;
            ctx.beginPath();
            ctx.moveTo(toScreenX(x), 0);
            ctx.lineTo(toScreenX(x), canvas.height);
            ctx.stroke();
            
            const y = minY + (maxY - minY) * i / 10;
            ctx.beginPath();
            ctx.moveTo(0, toScreenY(y));
            ctx.lineTo(canvas.width, toScreenY(y));
            ctx.stroke();
        }
        
        // Data points
        ctx.fillStyle = '#00d9ff';
        for (const point of this.dataPoints) {
            ctx.beginPath();
            ctx.arc(toScreenX(point.x), toScreenY(point.y), 5, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Current fit line
        const y1 = this.m0 + this.m1 * minX;
        const y2 = this.m0 + this.m1 * maxX;
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(toScreenX(minX), toScreenY(y1));
        ctx.lineTo(toScreenX(maxX), toScreenY(y2));
        ctx.stroke();
        
        // Next step prediction (dotted)
        const { gradM0, gradM1 } = this.calculateGradient(this.m0, this.m1);
        const nextM0 = this.m0 - this.learningRate * gradM0;
        const nextM1 = this.m1 - this.learningRate * gradM1;
        const nextY1 = nextM0 + nextM1 * minX;
        const nextY2 = nextM0 + nextM1 * maxX;
        
        ctx.strokeStyle = '#f9d423';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(toScreenX(minX), toScreenY(nextY1));
        ctx.lineTo(toScreenX(maxX), toScreenY(nextY2));
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Error lines
        ctx.strokeStyle = '#e9456040';
        ctx.lineWidth = 1;
        for (const point of this.dataPoints) {
            const predY = this.m0 + this.m1 * point.x;
            ctx.beginPath();
            ctx.moveTo(toScreenX(point.x), toScreenY(point.y));
            ctx.lineTo(toScreenX(point.x), toScreenY(predY));
            ctx.stroke();
        }
        
        // Labels
        ctx.fillStyle = '#00d9ff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('x', canvas.width - 20, canvas.height - 10);
        ctx.fillText('y', 10, 20);
    }
    
    updateThreeScene() {
        if (!this.scene) return;
        
        // Update current marker position
        const loss = this.calculateLoss(this.m0, this.m1);
        const lossNorm = loss / 10; // Normalize for display
        this.currentMarker.position.set(this.m0, lossNorm * 3, this.m1);
        
        // Update path
        if (this.pathHistory.length > 1) {
            const points = this.pathHistory.map(([m0, m1]) => {
                const l = this.calculateLoss(m0, m1) / 10;
                return new THREE.Vector3(m0, l * 3 + 0.05, m1);
            });
            this.pathLineGeometry.setFromPoints(points);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateInfo() {
        if (!this.options.showControls) return;
        
        document.getElementById('gd-m0-value').textContent = this.m0.toFixed(4);
        document.getElementById('gd-m1-value').textContent = this.m1.toFixed(4);
        document.getElementById('gd-error-value').textContent = this.calculateLoss(this.m0, this.m1).toFixed(4);
        document.getElementById('gd-steps-value').textContent = (this.pathHistory.length - 1).toString();
    }
    
    toScreenX(m0) {
        const range = 6;
        return (m0 + range/2) / range * this.paramCanvas.width;
    }
    
    toScreenY(m1) {
        const range = 6;
        return this.paramCanvas.height - (m1 + range/2) / range * this.paramCanvas.height;
    }
    
    fromScreenX(x) {
        const range = 6;
        return (x / this.paramCanvas.width) * range - range/2;
    }
    
    fromScreenY(y) {
        const range = 6;
        return -((y / this.paramCanvas.height) * range - range/2);
    }
    
    // Public API methods
    
    /**
     * Set the learning rate
     * @param {number} alpha - Learning rate value
     */
    setLearningRate(alpha) {
        this.learningRate = alpha;
        if (this.options.showControls) {
            document.getElementById('gd-learning-rate').value = alpha;
            document.getElementById('gd-lr-value').textContent = alpha.toFixed(3);
        }
    }
    
    /**
     * Take one or more gradient descent steps
     * @param {number} numSteps - Number of steps to take (default: 1)
     */
    step(numSteps = 1) {
        for (let i = 0; i < numSteps; i++) {
            this.gradientDescentStep();
        }
        this.draw();
    }
    
    /**
     * Reset the algorithm to a new random position
     */
    reset() {
        this.m0 = Math.random() * 4 - 2;
        this.m1 = Math.random() * 4 - 2;
        this.pathHistory = [[this.m0, this.m1]];
        this.draw();
    }
    
    /**
     * Generate new random data
     */
    newData() {
        this.generateData();
        this.draw();
    }
    
    /**
     * Get current parameters
     * @returns {{m0: number, m1: number, error: number}}
     */
    getState() {
        return {
            m0: this.m0,
            m1: this.m1,
            error: this.calculateLoss(this.m0, this.m1)
        };
    }
}

// Export for use in modules or direct script inclusion
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GradientDescentViz;
}

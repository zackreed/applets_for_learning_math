// Multivariable Chain Rule 3D Visualization
// Standalone JavaScript version - just paste into an HTML file with a canvas element

class MultivariableChainRuleViz {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Camera state
        this.cameraAngleX = 0.3;
        this.cameraAngleY = 0.8;
        this.cameraDistance = 8;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Point and direction state
        this.pointX = 0;
        this.pointY = 0;
        this.tParam = Math.PI / 4;
        this.directionAngle = Math.PI / 2;
        this.magnitude = 1.0;
        
        // Display toggles
        this.showGrid = true;
        this.showCurve = true;
        this.showTangentPlane = true;
        this.showVectors = true;
        
        // Current function
        this.currentFunction = 'paraboloid';
        
        // Surface functions and their derivatives
        this.functions = {
            paraboloid: {
                f: (x, y) => x*x + y*y,
                dfdx: (x, y) => 2*x,
                dfdy: (x, y) => 2*y,
                name: 'z = x² + y²'
            },
            saddle: {
                f: (x, y) => x*x - y*y,
                dfdx: (x, y) => 2*x,
                dfdy: (x, y) => -2*y,
                name: 'z = x² - y²'
            },
            waves: {
                f: (x, y) => Math.sin(x) * Math.cos(y),
                dfdx: (x, y) => Math.cos(x) * Math.cos(y),
                dfdy: (x, y) => -Math.sin(x) * Math.sin(y),
                name: 'z = sin(x)cos(y)'
            },
            hill: {
                f: (x, y) => 3 / (1 + x*x + y*y),
                dfdx: (x, y) => -6*x / Math.pow(1 + x*x + y*y, 2),
                dfdy: (x, y) => -6*y / Math.pow(1 + x*x + y*y, 2),
                name: 'z = 3/(1+x²+y²)'
            }
        };
        
        this.setupEventListeners();
    }
    
    // Parametric curve functions
    getCurvePoint(t) {
        const angle = this.directionAngle;
        const x = this.pointX + this.magnitude * Math.cos(angle) * (t - this.tParam);
        const y = this.pointY + this.magnitude * Math.sin(angle) * (t - this.tParam);
        return {x, y};
    }
    
    getCurveDerivative() {
        return {
            dx: this.magnitude * Math.cos(this.directionAngle),
            dy: this.magnitude * Math.sin(this.directionAngle)
        };
    }
    
    // 3D to 2D projection
    project3D(x, y, z) {
        // Rotate around Y axis
        const cosY = Math.cos(this.cameraAngleY);
        const sinY = Math.sin(this.cameraAngleY);
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;
        let y1 = y;
        
        // Rotate around X axis
        const cosX = Math.cos(this.cameraAngleX);
        const sinX = Math.sin(this.cameraAngleX);
        let y2 = y1 * cosX - z1 * sinX;
        let z2 = y1 * sinX + z1 * cosX;
        let x2 = x1;
        
        // Apply distance
        z2 += this.cameraDistance;
        
        // Perspective projection
        const scale = 600 / z2;
        const screenX = this.canvas.width / 2 + x2 * scale;
        const screenY = this.canvas.height / 2 - y2 * scale;
        
        return {x: screenX, y: screenY, depth: z2};
    }
    
    // Draw axes
    drawAxes() {
        const axisLength = 3;
        
        // X axis (red)
        this.drawLine3D(0, 0, 0, axisLength, 0, 0, '#e94560', 2);
        
        // Y axis (green)
        this.drawLine3D(0, 0, 0, 0, axisLength, 0, '#4ecca3', 2);
        
        // Z axis (blue)
        this.drawLine3D(0, 0, 0, 0, 0, axisLength, '#00d9ff', 2);
    }
    
    // Draw a 3D line
    drawLine3D(x1, y1, z1, x2, y2, z2, color, width = 2) {
        const p1 = this.project3D(x1, y1, z1);
        const p2 = this.project3D(x2, y2, z2);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
    }
    
    // Draw grid on xy-plane
    drawGrid() {
        if (!this.showGrid) return;
        
        const gridSize = 2;
        const step = 0.5;
        
        this.ctx.strokeStyle = 'rgba(74, 85, 104, 0.3)';
        this.ctx.lineWidth = 1;
        
        // Lines parallel to X axis
        for (let y = -gridSize; y <= gridSize; y += step) {
            const p1 = this.project3D(-gridSize, y, 0);
            const p2 = this.project3D(gridSize, y, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }
        
        // Lines parallel to Y axis
        for (let x = -gridSize; x <= gridSize; x += step) {
            const p1 = this.project3D(x, -gridSize, 0);
            const p2 = this.project3D(x, gridSize, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }
    }
    
    // Draw the surface
    drawSurface() {
        const func = this.functions[this.currentFunction];
        const resolution = 25;
        const range = 2;
        const step = (2 * range) / resolution;
        
        // Create mesh triangles
        const triangles = [];
        
        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const x1 = -range + i * step;
                const y1 = -range + j * step;
                const x2 = x1 + step;
                const y2 = y1 + step;
                
                const z1 = func.f(x1, y1);
                const z2 = func.f(x2, y1);
                const z3 = func.f(x1, y2);
                const z4 = func.f(x2, y2);
                
                // Two triangles per grid square
                triangles.push({
                    p1: {x: x1, y: y1, z: z1},
                    p2: {x: x2, y: y1, z: z2},
                    p3: {x: x1, y: y2, z: z3}
                });
                
                triangles.push({
                    p1: {x: x2, y: y1, z: z2},
                    p2: {x: x2, y: y2, z: z4},
                    p3: {x: x1, y: y2, z: z3}
                });
            }
        }
        
        // Sort triangles by depth (painter's algorithm)
        triangles.forEach(tri => {
            const avgZ = (tri.p1.z + tri.p2.z + tri.p3.z) / 3;
            const avgX = (tri.p1.x + tri.p2.x + tri.p3.x) / 3;
            const avgY = (tri.p1.y + tri.p2.y + tri.p3.y) / 3;
            const proj = this.project3D(avgX, avgY, avgZ);
            tri.depth = proj.depth;
        });
        
        triangles.sort((a, b) => b.depth - a.depth);
        
        // Draw triangles
        triangles.forEach(tri => {
            const p1 = this.project3D(tri.p1.x, tri.p1.y, tri.p1.z);
            const p2 = this.project3D(tri.p2.x, tri.p2.y, tri.p2.z);
            const p3 = this.project3D(tri.p3.x, tri.p3.y, tri.p3.z);
            
            // Calculate lighting based on normal
            const v1x = tri.p2.x - tri.p1.x;
            const v1y = tri.p2.y - tri.p1.y;
            const v1z = tri.p2.z - tri.p1.z;
            const v2x = tri.p3.x - tri.p1.x;
            const v2y = tri.p3.y - tri.p1.y;
            const v2z = tri.p3.z - tri.p1.z;
            
            const nx = v1y * v2z - v1z * v2y;
            const ny = v1z * v2x - v1x * v2z;
            const nz = v1x * v2y - v1y * v2x;
            
            const lightDot = Math.max(0.2, (nx + ny + nz * 2) / Math.sqrt(nx*nx + ny*ny + nz*nz) * 0.5 + 0.5);
            
            this.ctx.fillStyle = `rgba(78, 204, 163, ${lightDot * 0.6})`;
            this.ctx.strokeStyle = `rgba(78, 204, 163, 0.3)`;
            this.ctx.lineWidth = 0.5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.lineTo(p3.x, p3.y);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        });
    }
    
    // Draw the parametric curve through the surface
    drawCurve() {
        if (!this.showCurve) return;
        
        const func = this.functions[this.currentFunction];
        const tRange = 2;
        const tStart = this.tParam - tRange;
        const tEnd = this.tParam + tRange;
        const steps = 100;
        
        this.ctx.strokeStyle = '#ffe66d';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        let first = true;
        for (let i = 0; i <= steps; i++) {
            const t = tStart + (tEnd - tStart) * i / steps;
            const pt = this.getCurvePoint(t);
            const z = func.f(pt.x, pt.y);
            const proj = this.project3D(pt.x, pt.y, z);
            
            if (first) {
                this.ctx.moveTo(proj.x, proj.y);
                first = false;
            } else {
                this.ctx.lineTo(proj.x, proj.y);
            }
        }
        this.ctx.stroke();
    }
    
    // Draw tangent plane
    drawTangentPlane() {
        if (!this.showTangentPlane) return;
        
        const func = this.functions[this.currentFunction];
        const z0 = func.f(this.pointX, this.pointY);
        const dzdx = func.dfdx(this.pointX, this.pointY);
        const dzdy = func.dfdy(this.pointX, this.pointY);
        
        const size = 0.5;
        const corners = [
            {x: this.pointX - size, y: this.pointY - size},
            {x: this.pointX + size, y: this.pointY - size},
            {x: this.pointX + size, y: this.pointY + size},
            {x: this.pointX - size, y: this.pointY + size}
        ];
        
        corners.forEach(corner => {
            corner.z = z0 + dzdx * (corner.x - this.pointX) + dzdy * (corner.y - this.pointY);
        });
        
        const projCorners = corners.map(c => this.project3D(c.x, c.y, c.z));
        
        this.ctx.fillStyle = 'rgba(255, 230, 109, 0.3)';
        this.ctx.strokeStyle = '#ffe66d';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(projCorners[0].x, projCorners[0].y);
        for (let i = 1; i < projCorners.length; i++) {
            this.ctx.lineTo(projCorners[i].x, projCorners[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    // Draw vectors
    drawVectors() {
        if (!this.showVectors) return;
        
        const func = this.functions[this.currentFunction];
        const z0 = func.f(this.pointX, this.pointY);
        const dzdx = func.dfdx(this.pointX, this.pointY);
        const dzdy = func.dfdy(this.pointX, this.pointY);
        
        const deriv = this.getCurveDerivative();
        const dxdt = deriv.dx;
        const dydt = deriv.dy;
        
        // Draw partial derivative vectors (in tangent plane)
        const scale = 0.5;
        
        // ∂z/∂x direction (shows change in x direction)
        this.drawArrow3D(
            this.pointX, this.pointY, z0,
            this.pointX + scale, this.pointY, z0 + dzdx * scale,
            '#ff9d76', 3
        );
        
        // ∂z/∂y direction (shows change in y direction)
        this.drawArrow3D(
            this.pointX, this.pointY, z0,
            this.pointX, this.pointY + scale, z0 + dzdy * scale,
            '#ff9d76', 3
        );
        
        // dx/dt, dy/dt direction vector (on domain plane)
        this.drawArrow3D(
            this.pointX, this.pointY, 0,
            this.pointX + dxdt * 0.5, this.pointY + dydt * 0.5, 0,
            '#ffe66d', 3
        );
        
        // Total derivative dz/dt (along the curve)
        const dzdt = dzdx * dxdt + dzdy * dydt;
        const endX = this.pointX + dxdt * 0.5;
        const endY = this.pointY + dydt * 0.5;
        const endZ = z0 + dzdt * 0.5;
        
        this.drawArrow3D(
            this.pointX, this.pointY, z0,
            endX, endY, endZ,
            '#00d9ff', 4
        );
    }
    
    // Draw an arrow in 3D
    drawArrow3D(x1, y1, z1, x2, y2, z2, color, width = 2) {
        const p1 = this.project3D(x1, y1, z1);
        const p2 = this.project3D(x2, y2, z2);
        
        // Draw line
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        this.ctx.beginPath();
        this.ctx.moveTo(p2.x, p2.y);
        this.ctx.lineTo(
            p2.x - arrowLength * Math.cos(angle - arrowAngle),
            p2.y - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.ctx.moveTo(p2.x, p2.y);
        this.ctx.lineTo(
            p2.x - arrowLength * Math.cos(angle + arrowAngle),
            p2.y - arrowLength * Math.sin(angle + arrowAngle)
        );
        this.ctx.stroke();
    }
    
    // Draw the point
    drawPoint() {
        const func = this.functions[this.currentFunction];
        const z = func.f(this.pointX, this.pointY);
        const proj = this.project3D(this.pointX, this.pointY, z);
        
        // Draw vertical line from domain to surface
        const projBase = this.project3D(this.pointX, this.pointY, 0);
        this.ctx.strokeStyle = 'rgba(233, 69, 96, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(projBase.x, projBase.y);
        this.ctx.lineTo(proj.x, proj.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw point on surface
        this.ctx.fillStyle = '#e94560';
        this.ctx.beginPath();
        this.ctx.arc(proj.x, proj.y, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw point on domain
        this.ctx.fillStyle = 'rgba(233, 69, 96, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(projBase.x, projBase.y, 6, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    // Get chain rule values
    getChainRuleValues() {
        const func = this.functions[this.currentFunction];
        const z = func.f(this.pointX, this.pointY);
        const dzdx = func.dfdx(this.pointX, this.pointY);
        const dzdy = func.dfdy(this.pointX, this.pointY);
        const deriv = this.getCurveDerivative();
        const dzdt = dzdx * deriv.dx + dzdy * deriv.dy;
        
        return {
            pointX: this.pointX,
            pointY: this.pointY,
            z: z,
            dzdx: dzdx,
            dzdy: dzdy,
            dxdt: deriv.dx,
            dydt: deriv.dy,
            dzdt: dzdt
        };
    }
    
    // Main render function
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        this.drawAxes();
        this.drawSurface();
        this.drawTangentPlane();
        this.drawCurve();
        this.drawVectors();
        this.drawPoint();
    }
    
    // Setup event listeners
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                
                this.cameraAngleY += dx * 0.01;
                this.cameraAngleX += dy * 0.01;
                
                // Clamp camera angle
                this.cameraAngleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraAngleX));
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                
                this.render();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.cameraDistance += e.deltaY * 0.01;
            this.cameraDistance = Math.max(3, Math.min(15, this.cameraDistance));
            this.render();
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.isDragging) return;
            
            // Simple approximation: find point on xy plane nearest to click
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Try different xy points and find closest to click
            let minDist = Infinity;
            let bestX = 0, bestY = 0;
            
            for (let x = -2; x <= 2; x += 0.1) {
                for (let y = -2; y <= 2; y += 0.1) {
                    const proj = this.project3D(x, y, 0);
                    const dist = Math.hypot(proj.x - clickX, proj.y - clickY);
                    if (dist < minDist) {
                        minDist = dist;
                        bestX = x;
                        bestY = y;
                    }
                }
            }
            
            if (minDist < 30) {
                this.pointX = bestX;
                this.pointY = bestY;
                this.render();
            }
        });
    }
    
    // Public methods to control the visualization
    setFunction(funcName) {
        if (this.functions[funcName]) {
            this.currentFunction = funcName;
            this.render();
        }
    }
    
    setPoint(x, y) {
        this.pointX = x;
        this.pointY = y;
        this.render();
    }
    
    setDirection(angle, mag = 1.0) {
        this.directionAngle = angle;
        this.magnitude = mag;
        this.render();
    }
    
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.render();
    }
    
    toggleCurve() {
        this.showCurve = !this.showCurve;
        this.render();
    }
    
    toggleTangentPlane() {
        this.showTangentPlane = !this.showTangentPlane;
        this.render();
    }
    
    toggleVectors() {
        this.showVectors = !this.showVectors;
        this.render();
    }
}

// Usage example:
// <canvas id="myCanvas" width="900" height="700"></canvas>
// <script>
//     const viz = new MultivariableChainRuleViz('myCanvas');
//     viz.render();
//     
//     // Optional: Add controls
//     viz.setFunction('saddle');  // 'paraboloid', 'saddle', 'waves', 'hill'
//     viz.setPoint(1, 1);
//     viz.setDirection(Math.PI/4, 1.5);
//     
//     // Get values
//     const values = viz.getChainRuleValues();
//     console.log('dz/dt =', values.dzdt);
// </script>

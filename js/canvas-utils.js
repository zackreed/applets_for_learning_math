// Common canvas utilities for math visualizations

/**
 * Get mouse position accounting for borders, scaling, and scroll
 * @param {MouseEvent} evt - The mouse event
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @returns {{x: number, y: number}} - Mouse position in canvas coordinates
 */
function getMousePosition(evt, canvas) {
    const rect = canvas.getBoundingClientRect();
    const style = window.getComputedStyle(canvas);
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderTop = parseFloat(style.borderTopWidth) || 0;
    
    // Account for any scrolling in the iframe
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    return {
        x: evt.clientX - rect.left - borderLeft + scrollX,
        y: evt.clientY - rect.top - borderTop + scrollY
    };
}

/**
 * Convert canvas coordinates to mathematical coordinates
 * @param {number} cx - Canvas x coordinate
 * @param {number} cy - Canvas y coordinate
 * @param {Object} bounds - {xMin, xMax, yMin, yMax}
 * @param {number} padding - Padding around the graph
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {{x: number, y: number}} - Mathematical coordinates
 */
function canvasToMath(cx, cy, bounds, padding, canvasWidth, canvasHeight) {
    const width = canvasWidth - 2 * padding;
    const height = canvasHeight - 2 * padding;
    
    const x = bounds.xMin + (cx - padding) / width * (bounds.xMax - bounds.xMin);
    const y = bounds.yMax - (cy - padding) / height * (bounds.yMax - bounds.yMin);
    
    return { x, y };
}

/**
 * Convert mathematical coordinates to canvas coordinates
 * @param {number} x - Mathematical x coordinate
 * @param {number} y - Mathematical y coordinate
 * @param {Object} bounds - {xMin, xMax, yMin, yMax}
 * @param {number} padding - Padding around the graph
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {{cx: number, cy: number}} - Canvas coordinates
 */
function mathToCanvas(x, y, bounds, padding, canvasWidth, canvasHeight) {
    const width = canvasWidth - 2 * padding;
    const height = canvasHeight - 2 * padding;
    
    const cx = padding + (x - bounds.xMin) / (bounds.xMax - bounds.xMin) * width;
    const cy = padding + (bounds.yMax - y) / (bounds.yMax - bounds.yMin) * height;
    
    return { cx, cy };
}

/**
 * Draw axes on a canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} bounds - {xMin, xMax, yMin, yMax}
 * @param {number} padding - Padding around the graph
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 */
function drawAxes(ctx, bounds, padding, canvasWidth, canvasHeight) {
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    
    // Horizontal axis (y = 0)
    const y0 = mathToCanvas(0, 0, bounds, padding, canvasWidth, canvasHeight);
    const xLeft = mathToCanvas(bounds.xMin, 0, bounds, padding, canvasWidth, canvasHeight);
    const xRight = mathToCanvas(bounds.xMax, 0, bounds, padding, canvasWidth, canvasHeight);
    
    ctx.beginPath();
    ctx.moveTo(xLeft.cx, y0.cy);
    ctx.lineTo(xRight.cx, y0.cy);
    ctx.stroke();
    
    // Vertical axis (x = 0)
    const x0 = mathToCanvas(0, 0, bounds, padding, canvasWidth, canvasHeight);
    const yBottom = mathToCanvas(0, bounds.yMin, bounds, padding, canvasWidth, canvasHeight);
    const yTop = mathToCanvas(0, bounds.yMax, bounds, padding, canvasWidth, canvasHeight);
    
    ctx.beginPath();
    ctx.moveTo(x0.cx, yBottom.cy);
    ctx.lineTo(x0.cx, yTop.cy);
    ctx.stroke();
}

/**
 * Draw a grid on a canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} bounds - {xMin, xMax, yMin, yMax}
 * @param {number} padding - Padding around the graph
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 */
function drawGrid(ctx, bounds, padding, canvasWidth, canvasHeight) {
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Vertical grid lines
    for (let x = Math.ceil(bounds.xMin); x <= Math.floor(bounds.xMax); x++) {
        const top = mathToCanvas(x, bounds.yMax, bounds, padding, canvasWidth, canvasHeight);
        const bottom = mathToCanvas(x, bounds.yMin, bounds, padding, canvasWidth, canvasHeight);
        ctx.beginPath();
        ctx.moveTo(top.cx, top.cy);
        ctx.lineTo(bottom.cx, bottom.cy);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

/**
 * Draw a function curve on a canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Function} f - Function to plot
 * @param {Object} bounds - {xMin, xMax, yMin, yMax}
 * @param {number} padding - Padding around the graph
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {string} color - Stroke color
 * @param {number} lineWidth - Line width
 */
function drawFunction(ctx, f, bounds, padding, canvasWidth, canvasHeight, color = '#4ecca3', lineWidth = 3) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    
    let started = false;
    const steps = 200;
    const dx = (bounds.xMax - bounds.xMin) / steps;
    
    for (let i = 0; i <= steps; i++) {
        const x = bounds.xMin + i * dx;
        try {
            const y = f(x);
            if (!isNaN(y) && isFinite(y) && y >= bounds.yMin && y <= bounds.yMax) {
                const point = mathToCanvas(x, y, bounds, padding, canvasWidth, canvasHeight);
                if (!started) {
                    ctx.moveTo(point.cx, point.cy);
                    started = true;
                } else {
                    ctx.lineTo(point.cx, point.cy);
                }
            } else {
                started = false;
            }
        } catch (e) {
            started = false;
        }
    }
    
    ctx.stroke();
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Numerical derivative approximation
 * @param {Function} f - Function to differentiate
 * @param {number} x - Point to evaluate derivative
 * @param {number} h - Step size (default: 0.0001)
 * @returns {number} - Approximate derivative
 */
function derivative(f, x, h = 0.0001) {
    return (f(x + h) - f(x - h)) / (2 * h);
}

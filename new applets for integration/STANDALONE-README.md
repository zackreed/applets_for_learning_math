# Multivariable Chain Rule 3D Visualization - Standalone Version

## Overview

This is a pure JavaScript class that creates an interactive 3D visualization of the multivariable chain rule. It helps users understand how partial derivatives combine with direction vectors to produce the total derivative along parametric curves on surfaces.

## Files Included

- **`multivariable-chain-rule-standalone.js`** - The standalone JavaScript class
- **`multivariable-chain-rule-standalone-example.html`** - Example usage with controls

## Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>Chain Rule Viz</title>
</head>
<body>
    <canvas id="myCanvas" width="900" height="700"></canvas>
    
    <script src="multivariable-chain-rule-standalone.js"></script>
    <script>
        const viz = new MultivariableChainRuleViz('myCanvas');
        viz.render();
    </script>
</body>
</html>
```

## Features

### Interactive Controls

- **Drag**: Click and drag to rotate the 3D view
- **Scroll**: Mouse wheel to zoom in/out
- **Click**: Click on the domain plane to set the point location

### Surface Functions

Four built-in surface functions:
- `paraboloid`: z = x² + y²
- `saddle`: z = x² - y²
- `waves`: z = sin(x)cos(y)
- `hill`: z = 3/(1+x²+y²)

### Visual Elements

- **Green surface**: The function z = f(x,y)
- **Yellow curve**: Parametric curve through the surface
- **Yellow plane**: Tangent plane at the point
- **Orange arrows**: Partial derivative vectors (∂z/∂x, ∂z/∂y)
- **Yellow arrow (on domain)**: Direction vector (dx/dt, dy/dt)
- **Cyan arrow**: Total derivative dz/dt

## API Reference

### Constructor

```javascript
new MultivariableChainRuleViz(canvasId)
```

Creates a new visualization instance.

**Parameters:**
- `canvasId` (string): The ID of the canvas element

### Methods

#### `render()`
Renders the current state of the visualization.

```javascript
viz.render();
```

#### `setFunction(funcName)`
Changes the surface function.

```javascript
viz.setFunction('saddle');  // Options: 'paraboloid', 'saddle', 'waves', 'hill'
```

#### `setPoint(x, y)`
Sets the point location on the domain.

```javascript
viz.setPoint(1.0, 0.5);
```

#### `setDirection(angle, magnitude)`
Sets the direction vector angle and magnitude.

```javascript
viz.setDirection(Math.PI/4, 1.5);  // 45 degrees, magnitude 1.5
```

#### `getChainRuleValues()`
Returns the current chain rule values.

```javascript
const values = viz.getChainRuleValues();
console.log('Point:', values.pointX, values.pointY);
console.log('z =', values.z);
console.log('∂z/∂x =', values.dzdx);
console.log('∂z/∂y =', values.dzdy);
console.log('dx/dt =', values.dxdt);
console.log('dy/dt =', values.dydt);
console.log('dz/dt =', values.dzdt);
```

**Returns:** Object with properties:
- `pointX`, `pointY`: Current point coordinates
- `z`: Function value at the point
- `dzdx`, `dzdy`: Partial derivatives
- `dxdt`, `dydt`: Direction vector components
- `dzdt`: Total derivative (dz/dt = ∂z/∂x · dx/dt + ∂z/∂y · dy/dt)

#### Toggle Methods

```javascript
viz.toggleGrid();          // Toggle grid on/off
viz.toggleCurve();         // Toggle parametric curve on/off
viz.toggleTangentPlane();  // Toggle tangent plane on/off
viz.toggleVectors();       // Toggle vector arrows on/off
```

## Advanced Example

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        canvas { border: 2px solid #4a5568; background: #16213e; }
        .controls { margin-top: 20px; }
        button { padding: 10px; margin: 5px; }
    </style>
</head>
<body>
    <canvas id="viz" width="900" height="700"></canvas>
    
    <div class="controls">
        <button onclick="viz.setFunction('paraboloid')">Paraboloid</button>
        <button onclick="viz.setFunction('saddle')">Saddle</button>
        <button onclick="viz.setFunction('waves')">Waves</button>
        <button onclick="viz.setFunction('hill')">Hill</button>
        
        <br><br>
        
        <label>Direction Angle: <input type="range" id="angle" min="0" max="6.28" step="0.01" value="1.57"></label>
        <span id="angleVal">1.57</span>
        
        <br>
        
        <label>Magnitude: <input type="range" id="mag" min="0.1" max="2" step="0.1" value="1"></label>
        <span id="magVal">1.0</span>
        
        <br><br>
        
        <div id="values"></div>
    </div>
    
    <script src="multivariable-chain-rule-standalone.js"></script>
    <script>
        const viz = new MultivariableChainRuleViz('viz');
        viz.render();
        
        // Angle slider
        document.getElementById('angle').addEventListener('input', (e) => {
            const angle = parseFloat(e.target.value);
            const mag = parseFloat(document.getElementById('mag').value);
            document.getElementById('angleVal').textContent = angle.toFixed(2);
            viz.setDirection(angle, mag);
            updateValues();
        });
        
        // Magnitude slider
        document.getElementById('mag').addEventListener('input', (e) => {
            const mag = parseFloat(e.target.value);
            const angle = parseFloat(document.getElementById('angle').value);
            document.getElementById('magVal').textContent = mag.toFixed(1);
            viz.setDirection(angle, mag);
            updateValues();
        });
        
        // Display values
        function updateValues() {
            const v = viz.getChainRuleValues();
            document.getElementById('values').innerHTML = `
                <strong>Point:</strong> (${v.pointX.toFixed(2)}, ${v.pointY.toFixed(2)})<br>
                <strong>z =</strong> ${v.z.toFixed(3)}<br>
                <strong>∂z/∂x =</strong> ${v.dzdx.toFixed(3)}<br>
                <strong>∂z/∂y =</strong> ${v.dzdy.toFixed(3)}<br>
                <strong>dx/dt =</strong> ${v.dxdt.toFixed(3)}<br>
                <strong>dy/dt =</strong> ${v.dydt.toFixed(3)}<br>
                <strong>dz/dt =</strong> ${v.dzdt.toFixed(3)}
            `;
        }
        
        // Update values periodically
        setInterval(updateValues, 100);
        updateValues();
    </script>
</body>
</html>
```

## Mathematical Background

The multivariable chain rule states that if z = f(x,y) and x = x(t), y = y(t), then:

```
dz/dt = (∂z/∂x)(dx/dt) + (∂z/∂y)(dy/dt)
```

This can also be written as a dot product:

```
dz/dt = ∇f · v
```

where ∇f = (∂z/∂x, ∂z/∂y) is the gradient and v = (dx/dt, dy/dt) is the velocity vector.

### Interpretation

- **Gradient (∇f)**: Points in the direction of steepest ascent
- **Direction vector (v)**: Direction we're moving
- **Dot product**: Measures how well the movement aligns with the gradient
- **dz/dt**: Rate of change of z as we move along the parametric curve

## Customization

### Adding Custom Functions

You can add custom functions by modifying the `functions` object:

```javascript
viz.functions.custom = {
    f: (x, y) => x*y,           // Function definition
    dfdx: (x, y) => y,          // Partial derivative w.r.t. x
    dfdy: (x, y) => x,          // Partial derivative w.r.t. y
    name: 'z = xy'              // Display name
};

viz.setFunction('custom');
```

### Styling

The visualization uses these color conventions:
- Surface: `#4ecca3` (green)
- Point: `#e94560` (red)
- Curve: `#ffe66d` (yellow)
- Partial derivatives: `#ff9d76` (orange)
- Total derivative: `#00d9ff` (cyan)

Modify these in the source code to match your color scheme.

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript (class syntax)
- Arrow functions

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Free to use and modify for educational purposes.

## Credits

Created for interactive mathematics education. Part of the "Applets for Learning Math" project.

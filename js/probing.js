// Enhanced Probing Manager for FluidNC WebUI
class ProbingManager {
    constructor() {
        this.probeResults = {};
        this.heightMap = null;
        this.rotationAngle = 0;
        this.isProbing = false;
        this.currentRoutine = null;
        
        this.loadProbingGCode();
    }

    async loadProbingGCode() {
        // Load the probing G-code files from the FluidNC-Probing directory
        this.probingFiles = {};
        
        try {
            // In a real implementation, these would be loaded from the server
            // For now, we'll define them inline based on the existing files
            this.probingFiles = {
                'parameters': this.getProbeParametersGCode(),
                'center': this.getCenterProbeGCode(),
                'edge-top': this.getTopEdgeProbeGCode(),
                'edge-bottom': this.getBottomEdgeProbeGCode(),
                'edge-left': this.getLeftEdgeProbeGCode(),
                'edge-right': this.getRightEdgeProbeGCode(),
                'corner-tl': this.getTopLeftCornerGCode(),
                'corner-tr': this.getTopRightCornerGCode(),
                'corner-bl': this.getBottomLeftCornerGCode(),
                'corner-br': this.getBottomRightCornerGCode(),
                'center-external': this.getExternalCenterGCode(),
                'center-internal': this.getInternalCenterGCode()
            };
        } catch (error) {
            console.error('Error loading probing G-code:', error);
        }
    }

    async executeRoutine(routineName) {
        if (this.isProbing) {
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage('Probing routine already in progress', 'warning');
            }
            return;
        }

        if (!window.fluidNCApp || !window.fluidNCApp.isDeviceConnected()) {
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage('Device not connected', 'error');
            }
            return;
        }

        this.isProbing = true;
        this.currentRoutine = routineName;

        try {
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`Starting probing routine: ${routineName}`, 'info');
            }

            // Set probe parameters first
            await this.setProbeParameters();

            // Execute the specific routine
            switch (routineName) {
                case 'edge-top':
                case 'edge-bottom':
                case 'edge-left':
                case 'edge-right':
                    await this.executeEdgeProbing(routineName);
                    break;
                case 'corner-tl':
                case 'corner-tr':
                case 'corner-bl':
                case 'corner-br':
                    await this.executeCornerProbing(routineName);
                    break;
                case 'center-external':
                case 'center-internal':
                    await this.executeCenterProbing(routineName);
                    break;
                case 'height-map':
                    await this.executeHeightMapping();
                    break;
                case 'detect-rotation':
                    await this.executeRotationDetection();
                    break;
                default:
                    throw new Error(`Unknown probing routine: ${routineName}`);
            }

            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`Probing routine completed: ${routineName}`, 'info');
            }

        } catch (error) {
            console.error('Probing routine error:', error);
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`Probing error: ${error.message}`, 'error');
            }
        } finally {
            this.isProbing = false;
            this.currentRoutine = null;
        }
    }

    async setProbeParameters() {
        // Get parameters from UI
        const params = this.getProbeParametersFromUI();
        
        // Build parameter setting G-code
        const parameterCode = this.buildParameterGCode(params);
        
        // Send parameter commands
        for (const command of parameterCode) {
            await window.fluidNCApp.executeCommand(command);
        }
    }

    getProbeParametersFromUI() {
        return {
            rapidFr: document.getElementById('rapid-fr').value,
            searchFr: document.getElementById('search-fr').value,
            latchFr: document.getElementById('latch-fr').value,
            probingDist: document.getElementById('probing-dist').value,
            latchDist: document.getElementById('latch-dist').value,
            probeDiameter: document.getElementById('probe-diameter').value,
            xyClearance: document.getElementById('xy-clearance').value,
            probingDepth: document.getElementById('probing-depth').value,
            externalDiameter: document.getElementById('external-diameter').value,
            internalDiameter: document.getElementById('internal-diameter').value
        };
    }

    buildParameterGCode(params) {
        return [
            `#<_rapid_fr> = ${params.rapidFr}`,
            `#<_search_fr> = ${params.searchFr}`,
            `#<_latch_fr> = ${params.latchFr}`,
            `#<_probing_dist> = ${params.probingDist}`,
            `#<_latch_dist> = ${params.latchDist}`,
            `#<_probe_diameter> = ${params.probeDiameter}`,
            `#<_xy_clearance> = ${params.xyClearance}`,
            `#<_probing_depth> = ${params.probingDepth}`,
            `#<_i_diameter> = ${params.internalDiameter}`,
            `#<_o_diameter> = ${params.externalDiameter}`
        ];
    }

    async executeEdgeProbing(edge) {
        const gcode = this.probingFiles[edge];
        if (!gcode) {
            throw new Error(`No G-code found for edge probing: ${edge}`);
        }

        // Execute the edge probing G-code
        const commands = gcode.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('(');
        });

        for (const command of commands) {
            await window.fluidNCApp.executeCommand(command);
        }

        // Store the result (in a real implementation, parse the probe result)
        this.probeResults[edge] = {
            timestamp: new Date(),
            position: window.fluidNCApp.getCurrentPosition()
        };
    }

    async executeCornerProbing(corner) {
        const gcode = this.probingFiles[corner];
        if (!gcode) {
            throw new Error(`No G-code found for corner probing: ${corner}`);
        }

        const commands = gcode.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('(');
        });

        for (const command of commands) {
            await window.fluidNCApp.executeCommand(command);
        }

        this.probeResults[corner] = {
            timestamp: new Date(),
            position: window.fluidNCApp.getCurrentPosition()
        };
    }

    async executeCenterProbing(centerType) {
        const gcode = this.probingFiles[centerType];
        if (!gcode) {
            throw new Error(`No G-code found for center probing: ${centerType}`);
        }

        const commands = gcode.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('(');
        });

        for (const command of commands) {
            await window.fluidNCApp.executeCommand(command);
        }

        this.probeResults[centerType] = {
            timestamp: new Date(),
            position: window.fluidNCApp.getCurrentPosition()
        };
    }

    async executeHeightMapping() {
        const gridX = parseInt(document.getElementById('grid-x').value);
        const gridY = parseInt(document.getElementById('grid-y').value);
        const areaWidth = parseFloat(document.getElementById('area-width').value);
        const areaHeight = parseFloat(document.getElementById('area-height').value);

        if (gridX < 2 || gridY < 2 || areaWidth <= 0 || areaHeight <= 0) {
            throw new Error('Invalid height mapping parameters');
        }

        // Get current position as starting point
        const startPos = window.fluidNCApp.getCurrentPosition();
        
        // Calculate grid points
        const stepX = areaWidth / (gridX - 1);
        const stepY = areaHeight / (gridY - 1);
        
        const heightData = [];
        
        if (window.fluidNCApp) {
            window.fluidNCApp.addConsoleMessage(`Starting height map: ${gridX}x${gridY} grid over ${areaWidth}x${areaHeight}mm`, 'info');
        }

        // Probe each grid point
        for (let y = 0; y < gridY; y++) {
            for (let x = 0; x < gridX; x++) {
                const targetX = startPos.x + (x * stepX);
                const targetY = startPos.y + (y * stepY);
                
                // Move to XY position
                await window.fluidNCApp.executeCommand(`G0 X${targetX.toFixed(3)} Y${targetY.toFixed(3)}`);
                
                // Probe Z
                await window.fluidNCApp.executeCommand('G91'); // Relative mode
                const probeResult = await window.fluidNCApp.executeCommand(`G38.2 Z-${this.getProbeParametersFromUI().probingDist} F${this.getProbeParametersFromUI().searchFr}`);
                
                // Get the probed Z position (would need to parse from controller response)
                const currentPos = window.fluidNCApp.getCurrentPosition();
                heightData.push({
                    x: targetX,
                    y: targetY,
                    z: currentPos.z,
                    gridX: x,
                    gridY: y
                });
                
                // Retract Z
                await window.fluidNCApp.executeCommand(`G1 Z${this.getProbeParametersFromUI().probingDepth} F${this.getProbeParametersFromUI().rapidFr}`);
                await window.fluidNCApp.executeCommand('G90'); // Absolute mode
                
                // Update progress
                const progress = ((y * gridX + x + 1) / (gridX * gridY)) * 100;
                if (window.fluidNCApp) {
                    window.fluidNCApp.addConsoleMessage(`Height mapping progress: ${progress.toFixed(1)}%`, 'info');
                }
            }
        }

        // Create height map object
        this.heightMap = {
            grid: {
                width: gridX,
                height: gridY,
                data: heightData.map(point => point.z)
            },
            bounds: {
                minX: startPos.x,
                minY: startPos.y,
                maxX: startPos.x + areaWidth,
                maxY: startPos.y + areaHeight
            },
            points: heightData,
            timestamp: new Date()
        };

        // Enable height map application button
        document.getElementById('apply-height-map').disabled = false;

        if (window.fluidNCApp) {
            window.fluidNCApp.addConsoleMessage('Height mapping completed', 'info');
        }
    }

    async executeRotationDetection() {
        // Detect rotation by probing two points on an edge
        const currentPos = window.fluidNCApp.getCurrentPosition();
        const probeDistance = parseFloat(this.getProbeParametersFromUI().probingDist);
        
        // Probe first point (left edge)
        await window.fluidNCApp.executeCommand(`G0 X${currentPos.x - 10} Y${currentPos.y}`);
        await window.fluidNCApp.executeCommand('G91');
        await window.fluidNCApp.executeCommand(`G38.2 X${probeDistance} F${this.getProbeParametersFromUI().searchFr}`);
        const point1 = window.fluidNCApp.getCurrentPosition();
        
        // Retract and move to second point
        await window.fluidNCApp.executeCommand(`G1 X-2 F${this.getProbeParametersFromUI().rapidFr}`);
        await window.fluidNCApp.executeCommand('G90');
        await window.fluidNCApp.executeCommand(`G0 Y${currentPos.y + 20}`);
        
        // Probe second point
        await window.fluidNCApp.executeCommand('G91');
        await window.fluidNCApp.executeCommand(`G38.2 X${probeDistance} F${this.getProbeParametersFromUI().searchFr}`);
        const point2 = window.fluidNCApp.getCurrentPosition();
        
        // Retract
        await window.fluidNCApp.executeCommand(`G1 X-2 F${this.getProbeParametersFromUI().rapidFr}`);
        await window.fluidNCApp.executeCommand('G90');
        
        // Calculate rotation angle
        const deltaX = point2.x - point1.x;
        const deltaY = point2.y - point1.y;
        this.rotationAngle = Math.atan2(deltaX, deltaY) * (180 / Math.PI);
        
        // Update UI
        document.getElementById('rotation-angle').textContent = `${this.rotationAngle.toFixed(3)}°`;
        document.getElementById('apply-rotation').disabled = false;

        if (window.fluidNCApp) {
            window.fluidNCApp.addConsoleMessage(`Rotation detected: ${this.rotationAngle.toFixed(3)}°`, 'info');
        }
    }

    applyHeightMapToGCode() {
        if (!this.heightMap) {
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage('No height map available', 'error');
            }
            return;
        }

        try {
            window.fluidNCApp.gcodeManager.applyHeightMap(this.heightMap);
        } catch (error) {
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`Error applying height map: ${error.message}`, 'error');
            }
        }
    }

    applyRotationToGCode() {
        if (this.rotationAngle === 0) {
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage('No rotation angle detected', 'error');
            }
            return;
        }

        try {
            window.fluidNCApp.gcodeManager.applyRotation(this.rotationAngle);
        } catch (error) {
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`Error applying rotation: ${error.message}`, 'error');
            }
        }
    }

    // G-code templates based on existing files
    getProbeParametersGCode() {
        return `; Probe Parameters
#<_rapid_fr> = 3000
#<_search_fr> = 200
#<_latch_fr> = 50
#<_probing_dist> = 25
#<_latch_dist> = 2
#<_probe_diameter> = 2
#<_xy_clearance> = 10
#<_probing_depth> = 5
#<_i_diameter> = 4
#<_o_diameter> = 4`;
    }

    getCenterProbeGCode() {
        return `; Probe Centre
#<_probe_retract> = [#<_probing_depth> + #<_probe_diameter> / 2]
#<_probe_clearance> = [#<_probe_retract> - #<_probe_diameter> / 2]

G91
G38.2 Z[-#<_probing_dist>] F[#<_search_fr>]
G1 Z[+#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Z[-#<_latch_dist>] F[#<_latch_fr>]
G1 Z[+#<_probing_depth>] F[#<_rapid_fr>]
G10 L20 P0 Z[#<_probe_retract>]
G90`;
    }

    getTopEdgeProbeGCode() {
        return `; Top Edge Probe
G91
G38.2 Y[#<_probing_dist>] F[#<_search_fr>]
G1 Y[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 Y0
G1 Y[-#<_xy_clearance>] F[#<_rapid_fr>]
G90`;
    }

    getBottomEdgeProbeGCode() {
        return `; Bottom Edge Probe
G91
G38.2 Y[-#<_probing_dist>] F[#<_search_fr>]
G1 Y[#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[-#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 Y0
G1 Y[#<_xy_clearance>] F[#<_rapid_fr>]
G90`;
    }

    getLeftEdgeProbeGCode() {
        return `; Left Edge Probe
G91
G38.2 X[-#<_probing_dist>] F[#<_search_fr>]
G1 X[#<_latch_dist>] F[#<_rapid_fr>]
G38.2 X[-#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 X0
G1 X[#<_xy_clearance>] F[#<_rapid_fr>]
G90`;
    }

    getRightEdgeProbeGCode() {
        return `; Right Edge Probe
G91
G38.2 X[#<_probing_dist>] F[#<_search_fr>]
G1 X[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 X[#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 X0
G1 X[-#<_xy_clearance>] F[#<_rapid_fr>]
G90`;
    }

    getTopLeftCornerGCode() {
        return `; Top-Left Corner Probe
; Probe X- first
G91
G38.2 X[-#<_probing_dist>] F[#<_search_fr>]
G1 X[#<_latch_dist>] F[#<_rapid_fr>]
G38.2 X[-#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 X0
G1 X[#<_xy_clearance>] F[#<_rapid_fr>]

; Probe Y+ 
G38.2 Y[#<_probing_dist>] F[#<_search_fr>]
G1 Y[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 Y0
G1 Y[-#<_xy_clearance>] F[#<_rapid_fr>]
G90`;
    }

    getTopRightCornerGCode() {
        return `; Top-Right Corner Probe
; Probe X+ first
G91
G38.2 X[#<_probing_dist>] F[#<_search_fr>]
G1 X[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 X[#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 X0
G1 X[-#<_xy_clearance>] F[#<_rapid_fr>]

; Probe Y+
G38.2 Y[#<_probing_dist>] F[#<_search_fr>]
G1 Y[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 Y0
G1 Y[-#<_xy_clearance>] F[#<_rapid_fr>]
G90`;
    }

    getBottomLeftCornerGCode() {
        return `; Bottom-Left Corner Probe
; Probe X- first
G91
G38.2 X[-#<_probing_dist>] F[#<_search_fr>]
G1 X[#<_latch_dist>] F[#<_rapid_fr>]
G38.2 X[-#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 X0
G1 X[#<_xy_clearance>] F[#<_rapid_fr>]

; Probe Y-
G38.2 Y[-#<_probing_dist>] F[#<_search_fr>]
G1 Y[#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[-#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 Y0
G1 Y[#<_xy_clearance>] F[#<_rapid_fr>]
G90`;
    }

    getBottomRightCornerGCode() {
        return `; Bottom-Right Corner Probe
; Probe X+ first
G91
G38.2 X[#<_probing_dist>] F[#<_search_fr>]
G1 X[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 X[#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 X0
G1 X[-#<_xy_clearance>] F[#<_rapid_fr>]

; Probe Y-
G38.2 Y[-#<_probing_dist>] F[#<_search_fr>]
G1 Y[#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[-#<_latch_dist>] F[#<_latch_fr>]
G10 L20 P0 Y0
G1 Y[#<_xy_clearance>] F[#<_rapid_fr>]
G90`;
    }

    getExternalCenterGCode() {
        return `; External Center Finding
; Move to start position
G0 X[-#<_o_diameter>/2-#<_xy_clearance>] Y0

; Probe X+ to find right edge
G91
G38.2 X[#<_o_diameter>+#<_xy_clearance>*2] F[#<_search_fr>]
G1 X[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 X[#<_latch_dist>] F[#<_latch_fr>]
#<x_right> = #5061
G1 X[-#<_xy_clearance>] F[#<_rapid_fr>]

; Move to opposite side
G0 X[-#<_o_diameter>-#<_xy_clearance>*2]
; Probe X- to find left edge
G38.2 X[#<_o_diameter>+#<_xy_clearance>*2] F[#<_search_fr>]
G1 X[#<_latch_dist>] F[#<_rapid_fr>]
G38.2 X[-#<_latch_dist>] F[#<_latch_fr>]
#<x_left> = #5061
G1 X[#<_xy_clearance>] F[#<_rapid_fr>]

; Calculate and move to X center
#<x_center> = [#<x_left> + [#<x_right> - #<x_left>]/2]
G90
G0 X[#<x_center>]

; Similar process for Y axis
G0 Y[-#<_o_diameter>/2-#<_xy_clearance>]
G91
G38.2 Y[#<_o_diameter>+#<_xy_clearance>*2] F[#<_search_fr>]
G1 Y[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[#<_latch_dist>] F[#<_latch_fr>]
#<y_top> = #5062
G1 Y[-#<_xy_clearance>] F[#<_rapid_fr>]

G0 Y[-#<_o_diameter>-#<_xy_clearance>*2]
G38.2 Y[#<_o_diameter>+#<_xy_clearance>*2] F[#<_search_fr>]
G1 Y[#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[-#<_latch_dist>] F[#<_latch_fr>]
#<y_bottom> = #5062
G1 Y[#<_xy_clearance>] F[#<_rapid_fr>]

; Calculate and move to Y center
#<y_center> = [#<y_bottom> + [#<y_top> - #<y_bottom>]/2]
G90
G0 Y[#<y_center>]

; Set work coordinate system to center
G10 L20 P0 X0 Y0`;
    }

    getInternalCenterGCode() {
        return `; Internal Center Finding
; Probe X- to find left wall
G91
G38.2 X[-#<_i_diameter>/2] F[#<_search_fr>]
G1 X[#<_latch_dist>] F[#<_rapid_fr>]
G38.2 X[-#<_latch_dist>] F[#<_latch_fr>]
#<x_left> = #5061
G1 X[#<_xy_clearance>] F[#<_rapid_fr>]

; Probe X+ to find right wall
G38.2 X[#<_i_diameter>] F[#<_search_fr>]
G1 X[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 X[#<_latch_dist>] F[#<_latch_fr>]
#<x_right> = #5061
G1 X[-#<_xy_clearance>] F[#<_rapid_fr>]

; Calculate and move to X center
#<x_center> = [#<x_left> + [#<x_right> - #<x_left>]/2]
G90
G0 X[#<x_center>]

; Probe Y- to find bottom wall
G91
G38.2 Y[-#<_i_diameter>/2] F[#<_search_fr>]
G1 Y[#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[-#<_latch_dist>] F[#<_latch_fr>]
#<y_bottom> = #5062
G1 Y[#<_xy_clearance>] F[#<_rapid_fr>]

; Probe Y+ to find top wall
G38.2 Y[#<_i_diameter>] F[#<_search_fr>]
G1 Y[-#<_latch_dist>] F[#<_rapid_fr>]
G38.2 Y[#<_latch_dist>] F[#<_latch_fr>]
#<y_top> = #5062
G1 Y[-#<_xy_clearance>] F[#<_rapid_fr>]

; Calculate and move to Y center
#<y_center> = [#<y_bottom> + [#<y_top> - #<y_bottom>]/2]
G90
G0 Y[#<y_center>]

; Set work coordinate system to center
G10 L20 P0 X0 Y0`;
    }

    // Get probing results
    getProbeResults() {
        return this.probeResults;
    }

    // Get height map data
    getHeightMap() {
        return this.heightMap;
    }

    // Get detected rotation angle
    getRotationAngle() {
        return this.rotationAngle;
    }

    // Export height map data
    exportHeightMap() {
        if (!this.heightMap) {
            throw new Error('No height map data to export');
        }

        const data = JSON.stringify(this.heightMap, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `height_map_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        if (window.fluidNCApp) {
            window.fluidNCApp.addConsoleMessage('Height map exported', 'info');
        }
    }
}
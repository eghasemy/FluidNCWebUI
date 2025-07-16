// G-code Manager for FluidNC WebUI
class GCodeManager {
    constructor() {
        this.gcode = [];
        this.currentLine = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.fileName = '';
        this.totalLines = 0;
        this.sentLines = 0;
        this.executionStartTime = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // File input change handler is set up in main app
    }

    async loadFile(file) {
        if (!file) return;

        try {
            this.fileName = file.name;
            const text = await this.readFile(file);
            this.parseGCode(text);
            this.displayGCode();
            this.updateJobControls();
            
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`G-code file loaded: ${this.fileName} (${this.totalLines} lines)`, 'info');
            }
        } catch (error) {
            console.error('Error loading G-code file:', error);
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`Error loading file: ${error.message}`, 'error');
            }
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseGCode(text) {
        // Split into lines and clean up
        const lines = text.split('\n');
        this.gcode = [];
        
        lines.forEach((line, index) => {
            // Remove comments and trim whitespace
            let cleanLine = line.split(';')[0].trim();
            cleanLine = cleanLine.split('(')[0].trim(); // Remove parenthetical comments
            
            if (cleanLine) {
                this.gcode.push({
                    line: index + 1,
                    original: line.trim(),
                    command: cleanLine,
                    sent: false,
                    response: null
                });
            }
        });
        
        this.totalLines = this.gcode.length;
        this.currentLine = 0;
        this.sentLines = 0;
    }

    displayGCode() {
        const viewer = document.getElementById('gcode-content');
        if (viewer) {
            const content = this.gcode.map(item => 
                `${item.line.toString().padStart(4, ' ')}: ${item.original}`
            ).join('\n');
            viewer.value = content;
        }
    }

    updateJobControls() {
        const startBtn = document.getElementById('start-job');
        const pauseBtn = document.getElementById('pause-job');
        const stopBtn = document.getElementById('stop-job');
        
        if (this.gcode.length > 0 && !this.isRunning) {
            startBtn.disabled = false;
            startBtn.textContent = this.currentLine > 0 ? '▶️ Resume' : '▶️ Start';
        } else {
            startBtn.disabled = true;
        }
        
        pauseBtn.disabled = !this.isRunning;
        stopBtn.disabled = !this.isRunning && this.currentLine === 0;
    }

    async startJob() {
        if (!window.fluidNCApp || !window.fluidNCApp.isDeviceConnected()) {
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage('Device not connected', 'error');
            }
            return;
        }

        if (this.gcode.length === 0) {
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage('No G-code loaded', 'error');
            }
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.executionStartTime = Date.now();
        
        if (window.fluidNCApp) {
            window.fluidNCApp.addConsoleMessage('Starting G-code execution', 'info');
        }
        
        this.updateJobControls();
        this.executeNextLine();
    }

    pauseJob() {
        if (this.isRunning) {
            this.isPaused = true;
            this.isRunning = false;
            
            // Send pause command to controller
            if (window.fluidNCApp) {
                window.fluidNCApp.sendCommand('!'); // Feed hold
                window.fluidNCApp.addConsoleMessage('Job paused', 'info');
            }
            
            this.updateJobControls();
        }
    }

    stopJob() {
        this.isRunning = false;
        this.isPaused = false;
        
        // Send stop command to controller
        if (window.fluidNCApp) {
            window.fluidNCApp.sendCommand('~'); // Cycle start (resume)
            setTimeout(() => {
                window.fluidNCApp.emergencyStop(); // Then stop
            }, 100);
            window.fluidNCApp.addConsoleMessage('Job stopped', 'info');
        }
        
        this.resetProgress();
        this.updateJobControls();
    }

    async executeNextLine() {
        if (!this.isRunning || this.isPaused || this.currentLine >= this.gcode.length) {
            if (this.currentLine >= this.gcode.length) {
                this.completeJob();
            }
            return;
        }

        const gcodeItem = this.gcode[this.currentLine];
        
        try {
            // Send the command
            const response = await window.fluidNCApp.executeCommand(gcodeItem.command);
            
            // Mark as sent and store response
            gcodeItem.sent = true;
            gcodeItem.response = response;
            this.sentLines++;
            
            // Update progress
            this.updateProgress();
            
            // Move to next line
            this.currentLine++;
            
            // Continue execution
            if (this.isRunning) {
                // Small delay between commands to prevent overwhelming the controller
                setTimeout(() => {
                    this.executeNextLine();
                }, 10);
            }
            
        } catch (error) {
            console.error('G-code execution error:', error);
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`Execution error on line ${gcodeItem.line}: ${error.message}`, 'error');
            }
            
            // Stop execution on error
            this.stopJob();
        }
    }

    updateProgress() {
        const percentage = this.totalLines > 0 ? Math.round((this.sentLines / this.totalLines) * 100) : 0;
        
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${percentage}% (${this.sentLines}/${this.totalLines})`;
        }
    }

    completeJob() {
        this.isRunning = false;
        this.isPaused = false;
        
        const executionTime = this.executionStartTime ? 
            Math.round((Date.now() - this.executionStartTime) / 1000) : 0;
        
        if (window.fluidNCApp) {
            window.fluidNCApp.addConsoleMessage(
                `Job completed in ${executionTime}s. Lines executed: ${this.sentLines}/${this.totalLines}`, 
                'info'
            );
        }
        
        this.updateJobControls();
    }

    resetProgress() {
        this.currentLine = 0;
        this.sentLines = 0;
        
        // Reset all sent flags
        this.gcode.forEach(item => {
            item.sent = false;
            item.response = null;
        });
        
        this.updateProgress();
    }

    // Apply rotation transformation to loaded G-code
    applyRotation(angle) {
        if (this.gcode.length === 0) {
            throw new Error('No G-code loaded');
        }

        const angleRad = (angle * Math.PI) / 180;
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);

        const transformedGCode = this.gcode.map(item => {
            let command = item.command;
            
            // Look for X and Y coordinates in the command
            const xMatch = command.match(/X(-?\d+\.?\d*)/i);
            const yMatch = command.match(/Y(-?\d+\.?\d*)/i);
            
            if (xMatch && yMatch) {
                const x = parseFloat(xMatch[1]);
                const y = parseFloat(yMatch[1]);
                
                // Apply rotation transformation
                const newX = x * cosA - y * sinA;
                const newY = x * sinA + y * cosA;
                
                // Replace coordinates in command
                command = command.replace(/X-?\d+\.?\d*/i, `X${newX.toFixed(4)}`);
                command = command.replace(/Y-?\d+\.?\d*/i, `Y${newY.toFixed(4)}`);
            }
            
            return {
                ...item,
                command: command,
                original: command // Update original as well
            };
        });

        this.gcode = transformedGCode;
        this.displayGCode();
        
        if (window.fluidNCApp) {
            window.fluidNCApp.addConsoleMessage(`Applied rotation of ${angle.toFixed(3)}° to G-code`, 'info');
        }
    }

    // Apply height map compensation to loaded G-code
    applyHeightMap(heightMap) {
        if (this.gcode.length === 0) {
            throw new Error('No G-code loaded');
        }

        if (!heightMap || !heightMap.grid || !heightMap.bounds) {
            throw new Error('Invalid height map data');
        }

        const transformedGCode = this.gcode.map(item => {
            let command = item.command;
            
            // Look for X, Y, Z coordinates in the command
            const xMatch = command.match(/X(-?\d+\.?\d*)/i);
            const yMatch = command.match(/Y(-?\d+\.?\d*)/i);
            const zMatch = command.match(/Z(-?\d+\.?\d*)/i);
            
            if (xMatch && yMatch && zMatch) {
                const x = parseFloat(xMatch[1]);
                const y = parseFloat(yMatch[1]);
                const z = parseFloat(zMatch[1]);
                
                // Interpolate height compensation from height map
                const compensation = this.interpolateHeightCompensation(x, y, heightMap);
                const newZ = z + compensation;
                
                // Replace Z coordinate in command
                command = command.replace(/Z-?\d+\.?\d*/i, `Z${newZ.toFixed(4)}`);
            }
            
            return {
                ...item,
                command: command,
                original: command
            };
        });

        this.gcode = transformedGCode;
        this.displayGCode();
        
        if (window.fluidNCApp) {
            window.fluidNCApp.addConsoleMessage('Applied height map compensation to G-code', 'info');
        }
    }

    interpolateHeightCompensation(x, y, heightMap) {
        const { grid, bounds } = heightMap;
        const { minX, minY, maxX, maxY } = bounds;
        const { width, height } = grid;
        
        // Calculate grid position
        const gridX = ((x - minX) / (maxX - minX)) * (width - 1);
        const gridY = ((y - minY) / (maxY - minY)) * (height - 1);
        
        // Clamp to grid bounds
        const x1 = Math.max(0, Math.min(width - 2, Math.floor(gridX)));
        const y1 = Math.max(0, Math.min(height - 2, Math.floor(gridY)));
        const x2 = x1 + 1;
        const y2 = y1 + 1;
        
        // Get the four corner values
        const z11 = grid.data[y1 * width + x1] || 0;
        const z12 = grid.data[y2 * width + x1] || 0;
        const z21 = grid.data[y1 * width + x2] || 0;
        const z22 = grid.data[y2 * width + x2] || 0;
        
        // Bilinear interpolation
        const fx = gridX - x1;
        const fy = gridY - y1;
        
        const interpolated = 
            z11 * (1 - fx) * (1 - fy) +
            z21 * fx * (1 - fy) +
            z12 * (1 - fx) * fy +
            z22 * fx * fy;
        
        return interpolated;
    }

    // Get current G-code content
    getGCodeContent() {
        return this.gcode.map(item => item.original).join('\n');
    }

    // Get execution statistics
    getExecutionStats() {
        return {
            fileName: this.fileName,
            totalLines: this.totalLines,
            currentLine: this.currentLine,
            sentLines: this.sentLines,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            progress: this.totalLines > 0 ? (this.sentLines / this.totalLines) * 100 : 0
        };
    }

    // Export modified G-code
    exportGCode() {
        if (this.gcode.length === 0) {
            throw new Error('No G-code to export');
        }

        const content = this.getGCodeContent();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.fileName.replace(/\.[^/.]+$/, '') + '_modified.nc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        if (window.fluidNCApp) {
            window.fluidNCApp.addConsoleMessage('G-code exported', 'info');
        }
    }
}
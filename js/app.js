// FluidNC WebUI - Main Application
class FluidNCWebUI {
    constructor() {
        this.isConnected = false;
        this.connectionType = 'usb';
        this.currentPosition = { x: 0, y: 0, z: 0 };
        this.machinePosition = { x: 0, y: 0, z: 0 };
        this.machineState = 'Idle';
        
        this.serialComm = new SerialCommunication();
        this.websocketComm = new WebSocketCommunication();
        this.gcodeManager = new GCodeManager();
        this.probingManager = new ProbingManager();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateConnectionStatus();
        this.loadProbeParameters();
        this.setupConsole();
    }

    setupEventListeners() {
        // Connection type selection
        document.querySelectorAll('input[name="connection-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.connectionType = e.target.value;
                this.toggleConnectionControls();
            });
        });

        // USB connection controls
        document.getElementById('connect-usb').addEventListener('click', () => {
            this.connectUSB();
        });

        document.getElementById('disconnect-usb').addEventListener('click', () => {
            this.disconnectUSB();
        });

        // WebSocket connection controls
        document.getElementById('connect-websocket').addEventListener('click', () => {
            this.connectWebSocket();
        });

        document.getElementById('disconnect-websocket').addEventListener('click', () => {
            this.disconnectWebSocket();
        });

        // Emergency controls
        document.getElementById('emergency-stop').addEventListener('click', () => {
            this.emergencyStop();
        });

        document.getElementById('soft-reset').addEventListener('click', () => {
            this.softReset();
        });

        // Homing controls
        document.getElementById('home-all').addEventListener('click', () => {
            this.sendCommand('$H');
        });

        document.getElementById('home-x').addEventListener('click', () => {
            this.sendCommand('$HX');
        });

        document.getElementById('home-y').addEventListener('click', () => {
            this.sendCommand('$HY');
        });

        document.getElementById('home-z').addEventListener('click', () => {
            this.sendCommand('$HZ');
        });

        // Jog controls
        document.querySelectorAll('.jog-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const axis = e.target.dataset.axis;
                const direction = parseFloat(e.target.dataset.direction);
                const distance = parseFloat(document.getElementById('jog-distance').value);
                this.jog(axis, direction * distance);
            });
        });

        // Zero controls
        document.getElementById('zero-x').addEventListener('click', () => {
            this.sendCommand('G10 L20 P0 X0');
        });

        document.getElementById('zero-y').addEventListener('click', () => {
            this.sendCommand('G10 L20 P0 Y0');
        });

        document.getElementById('zero-z').addEventListener('click', () => {
            this.sendCommand('G10 L20 P0 Z0');
        });

        document.getElementById('zero-all').addEventListener('click', () => {
            this.sendCommand('G10 L20 P0 X0 Y0 Z0');
        });

        // G-code controls
        document.getElementById('load-gcode').addEventListener('click', () => {
            document.getElementById('gcode-file').click();
        });

        document.getElementById('gcode-file').addEventListener('change', (e) => {
            this.gcodeManager.loadFile(e.target.files[0]);
        });

        document.getElementById('start-job').addEventListener('click', () => {
            this.gcodeManager.startJob();
        });

        document.getElementById('pause-job').addEventListener('click', () => {
            this.gcodeManager.pauseJob();
        });

        document.getElementById('stop-job').addEventListener('click', () => {
            this.gcodeManager.stopJob();
        });

        // Console input
        document.getElementById('send-command').addEventListener('click', () => {
            this.sendConsoleCommand();
        });

        document.getElementById('command-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendConsoleCommand();
            }
        });

        // Probe parameter inputs
        document.querySelectorAll('.param-grid input').forEach(input => {
            input.addEventListener('change', () => {
                this.saveProbeParameters();
            });
        });

        // Probing routine buttons
        document.querySelectorAll('.probe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const routine = e.target.dataset.routine;
                this.probingManager.executeRoutine(routine);
            });
        });

        // Height map and rotation buttons
        document.getElementById('apply-height-map').addEventListener('click', () => {
            this.probingManager.applyHeightMapToGCode();
        });

        document.getElementById('apply-rotation').addEventListener('click', () => {
            this.probingManager.applyRotationToGCode();
        });
    }

    toggleConnectionControls() {
        const usbControls = document.getElementById('usb-controls');
        const websocketControls = document.getElementById('websocket-controls');
        
        if (this.connectionType === 'usb') {
            usbControls.style.display = 'flex';
            websocketControls.style.display = 'none';
        } else {
            usbControls.style.display = 'none';
            websocketControls.style.display = 'flex';
        }
    }

    async connectUSB() {
        try {
            this.updateConnectionStatus('connecting');
            await this.serialComm.connect();
            this.isConnected = true;
            this.updateConnectionStatus('connected');
            this.enableControls();
            this.startStatusUpdates();
            this.addConsoleMessage('USB connection established', 'info');
        } catch (error) {
            this.addConsoleMessage(`USB connection failed: ${error.message}`, 'error');
            this.updateConnectionStatus('disconnected');
        }
    }

    async disconnectUSB() {
        try {
            await this.serialComm.disconnect();
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
            this.disableControls();
            this.stopStatusUpdates();
            this.addConsoleMessage('USB connection closed', 'info');
        } catch (error) {
            this.addConsoleMessage(`Disconnect error: ${error.message}`, 'error');
        }
    }

    async connectWebSocket() {
        try {
            const url = document.getElementById('websocket-url').value;
            if (!url) {
                throw new Error('Please enter WebSocket URL');
            }
            
            this.updateConnectionStatus('connecting');
            await this.websocketComm.connect(url);
            this.isConnected = true;
            this.updateConnectionStatus('connected');
            this.enableControls();
            this.startStatusUpdates();
            this.addConsoleMessage('WebSocket connection established', 'info');
        } catch (error) {
            this.addConsoleMessage(`WebSocket connection failed: ${error.message}`, 'error');
            this.updateConnectionStatus('disconnected');
        }
    }

    async disconnectWebSocket() {
        try {
            await this.websocketComm.disconnect();
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
            this.disableControls();
            this.stopStatusUpdates();
            this.addConsoleMessage('WebSocket connection closed', 'info');
        } catch (error) {
            this.addConsoleMessage(`Disconnect error: ${error.message}`, 'error');
        }
    }

    updateConnectionStatus(status = null) {
        const indicator = document.getElementById('connection-indicator');
        const connectBtns = document.querySelectorAll('[id*="connect-"]');
        const disconnectBtns = document.querySelectorAll('[id*="disconnect-"]');
        
        if (status) {
            indicator.className = `status-${status}`;
            
            switch (status) {
                case 'connected':
                    indicator.innerHTML = '<i class="fas fa-circle"></i> Connected';
                    connectBtns.forEach(btn => btn.disabled = true);
                    disconnectBtns.forEach(btn => btn.disabled = false);
                    break;
                case 'connecting':
                    indicator.innerHTML = '<i class="fas fa-circle"></i> Connecting...';
                    connectBtns.forEach(btn => btn.disabled = true);
                    disconnectBtns.forEach(btn => btn.disabled = true);
                    break;
                default:
                    indicator.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
                    connectBtns.forEach(btn => btn.disabled = false);
                    disconnectBtns.forEach(btn => btn.disabled = true);
            }
        }
    }

    enableControls() {
        document.querySelectorAll('.jog-btn, #home-all, #home-x, #home-y, #home-z').forEach(btn => {
            btn.disabled = false;
        });
        
        document.querySelectorAll('#zero-x, #zero-y, #zero-z, #zero-all').forEach(btn => {
            btn.disabled = false;
        });
        
        document.getElementById('send-command').disabled = false;
    }

    disableControls() {
        document.querySelectorAll('.jog-btn, #home-all, #home-x, #home-y, #home-z').forEach(btn => {
            btn.disabled = true;
        });
        
        document.querySelectorAll('#zero-x, #zero-y, #zero-z, #zero-all').forEach(btn => {
            btn.disabled = true;
        });
        
        document.getElementById('send-command').disabled = true;
    }

    async sendCommand(command) {
        if (!this.isConnected) {
            this.addConsoleMessage('Not connected to device', 'error');
            return;
        }

        try {
            this.addConsoleMessage(`> ${command}`, 'sent');
            
            let response;
            if (this.connectionType === 'usb') {
                response = await this.serialComm.sendCommand(command);
            } else {
                response = await this.websocketComm.sendCommand(command);
            }
            
            if (response) {
                this.addConsoleMessage(response, 'received');
                this.parseResponse(response);
            }
        } catch (error) {
            this.addConsoleMessage(`Error: ${error.message}`, 'error');
        }
    }

    jog(axis, distance) {
        const command = `$J=G91 ${axis.toUpperCase()}${distance} F1000`;
        this.sendCommand(command);
    }

    emergencyStop() {
        if (this.isConnected) {
            // Send Ctrl+X (0x18) for immediate stop
            if (this.connectionType === 'usb') {
                this.serialComm.sendRaw(new Uint8Array([0x18]));
            } else {
                this.websocketComm.sendRaw('\\x18');
            }
            this.addConsoleMessage('EMERGENCY STOP SENT', 'error');
        }
    }

    softReset() {
        if (this.isConnected) {
            // Send Ctrl+X followed by soft reset
            if (this.connectionType === 'usb') {
                this.serialComm.sendRaw(new Uint8Array([0x18]));
                setTimeout(() => {
                    this.serialComm.sendCommand('$X');
                }, 100);
            } else {
                this.websocketComm.sendRaw('\\x18');
                setTimeout(() => {
                    this.websocketComm.sendCommand('$X');
                }, 100);
            }
            this.addConsoleMessage('Soft reset sent', 'info');
        }
    }

    sendConsoleCommand() {
        const input = document.getElementById('command-input');
        const command = input.value.trim();
        
        if (command) {
            this.sendCommand(command);
            input.value = '';
        }
    }

    parseResponse(response) {
        // Parse status reports and position updates
        if (response.startsWith('<') && response.endsWith('>')) {
            const statusMatch = response.match(/<([^|]+)\|([^>]+)>/);
            if (statusMatch) {
                this.machineState = statusMatch[1];
                
                // Parse position data
                const posData = statusMatch[2];
                const mposMatch = posData.match(/MPos:([^|]+)/);
                const wposMatch = posData.match(/WPos:([^|]+)/);
                
                if (mposMatch) {
                    const coords = mposMatch[1].split(',');
                    this.machinePosition = {
                        x: parseFloat(coords[0]) || 0,
                        y: parseFloat(coords[1]) || 0,
                        z: parseFloat(coords[2]) || 0
                    };
                    this.updatePositionDisplay('mpos', this.machinePosition);
                }
                
                if (wposMatch) {
                    const coords = wposMatch[1].split(',');
                    this.currentPosition = {
                        x: parseFloat(coords[0]) || 0,
                        y: parseFloat(coords[1]) || 0,
                        z: parseFloat(coords[2]) || 0
                    };
                    this.updatePositionDisplay('wpos', this.currentPosition);
                }
            }
        }
    }

    updatePositionDisplay(type, position) {
        document.getElementById(`${type}-x`).textContent = position.x.toFixed(3);
        document.getElementById(`${type}-y`).textContent = position.y.toFixed(3);
        document.getElementById(`${type}-z`).textContent = position.z.toFixed(3);
    }

    startStatusUpdates() {
        this.statusInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendCommand('?');
            }
        }, 1000);
    }

    stopStatusUpdates() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }

    setupConsole() {
        // Set up console auto-scroll
        this.consoleOutput = document.getElementById('console-output');
    }

    addConsoleMessage(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const messageDiv = document.createElement('div');
        messageDiv.className = `console-message ${type}`;
        messageDiv.innerHTML = `[${timestamp}] ${message}`;
        
        this.consoleOutput.appendChild(messageDiv);
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
        
        // Limit console history to 1000 messages
        const messages = this.consoleOutput.children;
        if (messages.length > 1000) {
            this.consoleOutput.removeChild(messages[0]);
        }
    }

    loadProbeParameters() {
        // Load saved probe parameters from localStorage
        const saved = localStorage.getItem('fluidnc-probe-params');
        if (saved) {
            const params = JSON.parse(saved);
            Object.keys(params).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = params[key];
                }
            });
        }
    }

    saveProbeParameters() {
        // Save probe parameters to localStorage
        const params = {};
        document.querySelectorAll('.param-grid input').forEach(input => {
            params[input.id] = input.value;
        });
        localStorage.setItem('fluidnc-probe-params', JSON.stringify(params));
    }

    // Public methods for other modules to use
    getCurrentPosition() {
        return this.currentPosition;
    }

    getMachinePosition() {
        return this.machinePosition;
    }

    isDeviceConnected() {
        return this.isConnected;
    }

    getConnectionType() {
        return this.connectionType;
    }

    async executeCommand(command) {
        return await this.sendCommand(command);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fluidNCApp = new FluidNCWebUI();
});
// FluidNC WebUI - Main Application
class FluidNCWebUI {
    constructor() {
        this.isConnected = false;
        this.connectionType = 'usb';
        this.currentPosition = { x: 0, y: 0, z: 0 };
        this.machinePosition = { x: 0, y: 0, z: 0 };
        this.machineState = 'Idle';
        this.verboseMode = false;
        this.debugMode = false;
        this.autoScroll = true;
        this.savedWebSocketUrls = this.loadSavedUrls();
        this.macros = this.loadMacros();
        this.spindleSpeed = 0;
        this.spindleEnabled = false;
        
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
        this.setupFileTabs();
        this.setupMacros();
        this.setupSpindleControls();
        this.populateWebSocketUrlDropdown();
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

        // Status controls
        document.getElementById('unlock').addEventListener('click', () => {
            this.sendCommand('$X');
        });

        document.getElementById('sleep').addEventListener('click', () => {
            this.sendCommand('$SLP');
        });

        document.getElementById('pause-resume').addEventListener('click', () => {
            this.togglePauseResume();
        });

        // Terminal controls
        document.getElementById('verbose-mode').addEventListener('change', (e) => {
            this.verboseMode = e.target.checked;
        });

        document.getElementById('debug-mode').addEventListener('change', (e) => {
            this.debugMode = e.target.checked;
        });

        document.getElementById('autoscroll').addEventListener('change', (e) => {
            this.autoScroll = e.target.checked;
        });

        document.getElementById('clear-console').addEventListener('click', () => {
            this.clearConsole();
        });

        // File tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchFileTab(e.target.dataset.tab);
            });
        });

        // Macro controls
        document.querySelectorAll('.macro-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const macroNum = e.target.dataset.macro;
                this.runMacro(macroNum);
            });
        });

        document.getElementById('save-macro').addEventListener('click', () => {
            this.saveMacro();
        });

        // Spindle controls
        document.getElementById('set-spindle-speed').addEventListener('click', () => {
            const speed = document.getElementById('spindle-speed').value;
            this.sendCommand(`S${speed}`);
        });

        document.getElementById('spindle-on-cw').addEventListener('click', () => {
            this.sendCommand('M3');
        });

        document.getElementById('spindle-on-ccw').addEventListener('click', () => {
            this.sendCommand('M4');
        });

        document.getElementById('spindle-off').addEventListener('click', () => {
            this.sendCommand('M5');
        });

        // Override controls
        document.querySelectorAll('.override-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cmd = e.target.dataset.cmd;
                this.sendOverrideCommand(cmd);
            });
        });

        // WebSocket URL management
        document.getElementById('save-websocket-url').addEventListener('click', () => {
            this.saveWebSocketUrl();
        });

        document.getElementById('websocket-url-select').addEventListener('change', (e) => {
            const url = e.target.value;
            if (url) {
                document.getElementById('websocket-url').value = url;
            }
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
            
            // Wait a moment for connection to stabilize, then start status updates
            setTimeout(() => {
                this.startStatusUpdates();
                // Request initial status and position
                this.requestInitialStatus();
            }, 1000);
            
            this.addConsoleMessage('WebSocket connection established', 'info');
        } catch (error) {
            this.addConsoleMessage(`WebSocket connection failed: ${error.message}`, 'error');
            this.updateConnectionStatus('disconnected');
        }
    }

    async requestInitialStatus() {
        try {
            // Request current status and position
            await this.websocketComm.sendCommandNoWait('?');
            await this.websocketComm.sendCommandNoWait('$G'); // Get current G-code state
            await this.websocketComm.sendCommandNoWait('$#'); // Get coordinate systems
            
            this.addConsoleMessage('Requesting initial machine status...', 'info');
        } catch (error) {
            console.error('Initial status request error:', error);
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
                this.websocketComm.sendRaw('\x18');
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
                this.websocketComm.sendRaw('\x18');
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
        // Debug mode: log all raw responses
        if (this.debugMode) {
            this.addConsoleMessage(`[DEBUG] Raw response: ${response}`, 'debug');
        }
        
        // Parse different types of responses from FluidNC
        
        // Parse status reports (format: <Idle|MPos:0.000,0.000,0.000|FS:0,0>)
        if (response.startsWith('<') && response.endsWith('>')) {
            this.parseStatusReport(response);
            return;
        }
        
        // Parse position reports (format: [MSG:INFO: Current position: X:0.00 Y:0.00 Z:0.00])
        if (response.includes('Current position:')) {
            this.parsePositionReport(response);
            return;
        }
        
        // Parse file listing responses
        if (response.includes('[FILE:') || response.includes('[DIR:')) {
            this.parseFileListResponse(response);
            return;
        }
        
        // Parse machine state changes
        if (response.includes('[MSG:INFO:') && (response.includes('Idle') || response.includes('Run') || response.includes('Hold'))) {
            this.parseMachineStateMessage(response);
            return;
        }
        
        // Parse error messages
        if (response.startsWith('error:')) {
            this.addConsoleMessage(response, 'error');
            return;
        }
        
        // Parse ok responses
        if (response.trim() === 'ok') {
            // Don't log simple ok responses unless in verbose mode
            if (this.verboseMode) {
                this.addConsoleMessage(response, 'received');
            }
            return;
        }
        
        // Default: log all other responses
        this.addConsoleMessage(response, 'received');
    }

    parseStatusReport(response) {
        try {
            // Handle FluidNC status format: <Idle|MPos:0.000,0.000,0.000|WPos:0.000,0.000,0.000|FS:0,0>
            const content = response.slice(1, -1); // Remove < >
            const parts = content.split('|');
            
            if (parts.length > 0) {
                const state = parts[0];
                this.updateMachineState(state);
            }
            
            // Parse position data
            parts.forEach(part => {
                if (part.startsWith('MPos:')) {
                    const coords = part.substring(5).split(',');
                    this.machinePosition = {
                        x: parseFloat(coords[0]) || 0,
                        y: parseFloat(coords[1]) || 0,
                        z: parseFloat(coords[2]) || 0
                    };
                    this.updatePositionDisplay('mpos', this.machinePosition);
                } else if (part.startsWith('WPos:')) {
                    const coords = part.substring(5).split(',');
                    this.currentPosition = {
                        x: parseFloat(coords[0]) || 0,
                        y: parseFloat(coords[1]) || 0,
                        z: parseFloat(coords[2]) || 0
                    };
                    this.updatePositionDisplay('wpos', this.currentPosition);
                }
            });
            
            // Only log status reports in verbose mode
            if (this.verboseMode) {
                this.addConsoleMessage(response, 'received');
            }
        } catch (error) {
            console.error('Error parsing status report:', error);
        }
    }

    parsePositionReport(response) {
        try {
            // Parse position from messages like: [MSG:INFO: Current position: X:0.00 Y:0.00 Z:0.00]
            const xMatch = response.match(/X:([-\d.]+)/);
            const yMatch = response.match(/Y:([-\d.]+)/);
            const zMatch = response.match(/Z:([-\d.]+)/);
            
            if (xMatch && yMatch && zMatch) {
                this.currentPosition = {
                    x: parseFloat(xMatch[1]) || 0,
                    y: parseFloat(yMatch[1]) || 0,
                    z: parseFloat(zMatch[1]) || 0
                };
                this.updatePositionDisplay('wpos', this.currentPosition);
            }
        } catch (error) {
            console.error('Error parsing position report:', error);
        }
    }

    parseFileListResponse(response) {
        try {
            // Handle FluidNC file listing responses
            if (response.includes('[FILE:')) {
                // Extract file info: [FILE:filename.gcode|SIZE:1234]
                const match = response.match(/\[FILE:([^|]+)\|SIZE:(\d+)\]/);
                if (match) {
                    const filename = match[1];
                    const size = match[2];
                    this.addFileToList(filename, size, 'file');
                }
            } else if (response.includes('[DIR:')) {
                // Extract directory info: [DIR:foldername]
                const match = response.match(/\[DIR:([^\]]+)\]/);
                if (match) {
                    const dirname = match[1];
                    this.addFileToList(dirname, '', 'dir');
                }
            }
            
            // Debug: log all file-related responses
            if (this.debugMode) {
                this.addConsoleMessage(`[DEBUG] File response: ${response}`, 'debug');
            }
        } catch (error) {
            console.error('Error parsing file list response:', error);
        }
    }

    addFileToList(name, size, type) {
        // Determine which file list to update based on current tab
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        const fileListId = `${activeTab}-file-list`;
        const fileList = document.getElementById(fileListId);
        
        // Create or update file list if it's showing placeholder text
        if (fileList.querySelector('p')) {
            fileList.innerHTML = '';
        }

        const fileItem = document.createElement('div');
        fileItem.className = `file-item ${type}`;
        
        const icon = type === 'dir' ? 'fa-folder' : 'fa-file';
        const sizeText = size ? ` (${this.formatFileSize(size)})` : '';
        
        fileItem.innerHTML = `
            <i class="fas ${icon}"></i>
            <span class="file-name">${name}</span>
            <span class="file-size">${sizeText}</span>
            <button class="btn btn-sm file-action" onclick="window.fluidNCApp.selectFile('${name}', '${type}')">
                ${type === 'dir' ? 'Open' : 'Select'}
            </button>
        `;
        
        fileList.appendChild(fileItem);
    }

    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }

    selectFile(filename, type) {
        if (type === 'dir') {
            // Navigate into directory (implementation depends on FluidNC's file system structure)
            this.addConsoleMessage(`Opening directory: ${filename}`, 'info');
        } else {
            // Select file for loading
            this.addConsoleMessage(`Selected file: ${filename}`, 'info');
            // Could implement file loading from SD/Flash here
        }
    }

    parseMachineStateMessage(response) {
        try {
            // Parse state from messages like: [MSG:INFO: Machine state changed to Idle]
            if (response.includes('Idle')) {
                this.updateMachineState('Idle');
            } else if (response.includes('Run')) {
                this.updateMachineState('Run');
            } else if (response.includes('Hold')) {
                this.updateMachineState('Hold');
            }
        } catch (error) {
            console.error('Error parsing machine state:', error);
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
                // Use status query command that works with FluidNC WebSocket
                this.requestStatus();
            }
        }, 1000);
    }

    async requestStatus() {
        try {
            if (this.connectionType === 'usb') {
                await this.sendCommand('?');
            } else {
                // For WebSocket, send status request directly without waiting for response
                // FluidNC responds to simple status query
                this.websocketComm.socket.send('?');
            }
        } catch (error) {
            console.error('Status request error:', error);
        }
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
        
        if (this.autoScroll) {
            this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
        }
        
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

    // New methods for enhanced functionality
    togglePauseResume() {
        const btn = document.getElementById('pause-resume');
        if (btn.textContent.includes('Pause')) {
            this.sendCommand('!'); // Feed hold
            btn.innerHTML = '<i class="fas fa-play"></i> Resume';
        } else {
            this.sendCommand('~'); // Resume
            btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    }

    clearConsole() {
        this.consoleOutput.innerHTML = '';
    }

    switchFileTab(tab) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-files`).classList.add('active');
        
        // Load files for SD/Flash tabs
        if (tab === 'sd') {
            this.loadSDFiles();
        } else if (tab === 'flash') {
            this.loadFlashFiles();
        }
    }

    loadSDFiles() {
        if (!this.isConnected) {
            const fileList = document.getElementById('sd-file-list');
            fileList.innerHTML = '<p>Not connected to device</p>';
            return;
        }
        
        const fileList = document.getElementById('sd-file-list');
        fileList.innerHTML = '<p>Loading SD card files...</p>';
        
        // Use FluidNC's file listing command for SD card
        this.sendCommand('$SD/List').then(() => {
            // Response will be handled by parseFileListResponse
        }).catch(error => {
            fileList.innerHTML = '<p>Error loading SD card files</p>';
            this.addConsoleMessage(`SD card error: ${error.message}`, 'error');
        });
    }

    loadFlashFiles() {
        if (!this.isConnected) {
            const fileList = document.getElementById('flash-file-list');
            fileList.innerHTML = '<p>Not connected to device</p>';
            return;
        }
        
        const fileList = document.getElementById('flash-file-list');
        fileList.innerHTML = '<p>Loading flash files...</p>';
        
        // Use FluidNC's file listing command for flash/SPIFFS
        this.sendCommand('$LocalFS/List').then(() => {
            // Response will be handled by parseFileListResponse
        }).catch(error => {
            fileList.innerHTML = '<p>Error loading flash files</p>';
            this.addConsoleMessage(`Flash storage error: ${error.message}`, 'error');
        });
    }

    runMacro(macroNum) {
        this.sendCommand(`$${macroNum}`);
    }

    saveMacro() {
        const content = document.getElementById('macro-content').value;
        // Implementation for saving macros would depend on FluidNC's macro system
        this.addConsoleMessage(`Macro content: ${content}`, 'info');
    }

    sendOverrideCommand(cmd) {
        // Convert hex string to appropriate command
        const hexValue = parseInt(cmd, 16);
        if (this.connectionType === 'usb') {
            this.serialComm.sendRaw(new Uint8Array([hexValue]));
        } else {
            this.websocketComm.sendRaw(String.fromCharCode(hexValue));
        }
    }

    updateMachineState(state) {
        this.machineState = state;
        const stateElement = document.getElementById('machine-state');
        stateElement.textContent = state;
        stateElement.className = `state-${state.toLowerCase()}`;
        
        // Update pause/resume button based on state
        const pauseBtn = document.getElementById('pause-resume');
        if (state === 'Run') {
            pauseBtn.disabled = false;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        } else if (state === 'Hold') {
            pauseBtn.disabled = false;
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        } else {
            pauseBtn.disabled = true;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    }

    // WebSocket URL management
    loadSavedUrls() {
        const saved = localStorage.getItem('fluidnc-websocket-urls');
        return saved ? JSON.parse(saved) : [];
    }

    saveSavedUrls() {
        localStorage.setItem('fluidnc-websocket-urls', JSON.stringify(this.savedWebSocketUrls));
    }

    populateWebSocketUrlDropdown() {
        const select = document.getElementById('websocket-url-select');
        // Clear existing options except the first one
        select.innerHTML = '<option value="">Select or enter URL...</option>';
        
        this.savedWebSocketUrls.forEach((urlData, index) => {
            const option = document.createElement('option');
            option.value = urlData.url;
            option.textContent = urlData.name || urlData.url;
            select.appendChild(option);
        });
    }

    saveWebSocketUrl() {
        const url = document.getElementById('websocket-url').value.trim();
        if (!url) {
            this.addConsoleMessage('Please enter a WebSocket URL', 'error');
            return;
        }

        // Check if URL already exists
        const exists = this.savedWebSocketUrls.find(item => item.url === url);
        if (exists) {
            this.addConsoleMessage('URL already saved', 'info');
            return;
        }

        // Prompt for name
        const name = prompt('Enter a name for this connection:', url);
        if (name === null) return; // User cancelled

        this.savedWebSocketUrls.push({
            url: url,
            name: name || url
        });

        this.saveSavedUrls();
        this.populateWebSocketUrlDropdown();
        this.addConsoleMessage(`WebSocket URL saved: ${name || url}`, 'info');
    }

    // Macro management
    loadMacros() {
        const saved = localStorage.getItem('fluidnc-macros');
        return saved ? JSON.parse(saved) : {};
    }

    saveMacros() {
        localStorage.setItem('fluidnc-macros', JSON.stringify(this.macros));
    }

    setupMacros() {
        // Setup macro functionality
        // Load existing macros from storage
    }

    setupSpindleControls() {
        // Setup spindle control functionality
    }

    setupFileTabs() {
        // File tab setup is handled in event listeners
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fluidNCApp = new FluidNCWebUI();
});
// Serial Communication Module for FluidNC WebUI
class SerialCommunication {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.responseBuffer = '';
        this.pendingCommands = new Map();
        this.commandId = 0;
    }

    async connect() {
        try {
            // Check if Web Serial API is supported
            if (!('serial' in navigator)) {
                throw new Error('Web Serial API not supported in this browser. Please use Chrome 89+, Edge 89+, or Opera 75+. Make sure you are using a Chromium-based browser.');
            }

            // Check if secure context (HTTPS or localhost)
            if (!window.isSecureContext) {
                throw new Error('Web Serial API requires a secure context (HTTPS or localhost). Try accessing via localhost or HTTPS.');
            }

            // Check if the API is available (some browsers may have it disabled)
            if (!navigator.serial.requestPort) {
                throw new Error('Web Serial API is disabled or not available. Please enable it in your browser settings.');
            }

            // Request a port and open it
            this.port = await navigator.serial.requestPort();
            
            await this.port.open({
                baudRate: 115200,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });

            // Get reader and writer
            this.reader = this.port.readable.getReader();
            this.writer = this.port.writable.getWriter();
            
            this.isConnected = true;
            
            // Start reading data
            this.startReading();
            
            return true;
        } catch (error) {
            console.error('Serial connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            this.isConnected = false;
            
            // Cancel reader and close writer
            if (this.reader) {
                await this.reader.cancel();
                this.reader.releaseLock();
                this.reader = null;
            }
            
            if (this.writer) {
                await this.writer.close();
                this.writer.releaseLock();
                this.writer = null;
            }
            
            // Close the port
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            
            return true;
        } catch (error) {
            console.error('Serial disconnect error:', error);
            throw error;
        }
    }

    async startReading() {
        const decoder = new TextDecoder();
        
        try {
            while (this.isConnected && this.reader) {
                const { value, done } = await this.reader.read();
                
                if (done) {
                    break;
                }
                
                // Decode the received data
                const text = decoder.decode(value);
                this.responseBuffer += text;
                
                // Process complete lines
                this.processBuffer();
            }
        } catch (error) {
            if (this.isConnected) {
                console.error('Serial read error:', error);
                // Notify the application about the connection loss
                if (window.fluidNCApp) {
                    window.fluidNCApp.addConsoleMessage('Serial connection lost', 'error');
                    window.fluidNCApp.updateConnectionStatus('disconnected');
                }
            }
        }
    }

    processBuffer() {
        while (this.responseBuffer.includes('\n')) {
            const lineEnd = this.responseBuffer.indexOf('\n');
            const line = this.responseBuffer.substring(0, lineEnd).trim();
            this.responseBuffer = this.responseBuffer.substring(lineEnd + 1);
            
            if (line) {
                this.handleResponse(line);
            }
        }
    }

    handleResponse(response) {
        // Log the response if there's an app instance
        if (window.fluidNCApp) {
            // Don't log status reports to reduce console clutter
            if (!response.startsWith('<') || !response.endsWith('>')) {
                window.fluidNCApp.addConsoleMessage(response, 'received');
            }
            
            // Parse the response for position updates, etc.
            window.fluidNCApp.parseResponse(response);
        }
        
        // Handle command responses
        if (response === 'ok' || response.startsWith('error:')) {
            // Find and resolve pending command
            const commandId = Array.from(this.pendingCommands.keys())[0];
            if (commandId !== undefined) {
                const resolver = this.pendingCommands.get(commandId);
                if (resolver) {
                    resolver(response);
                    this.pendingCommands.delete(commandId);
                }
            }
        }
    }

    async sendCommand(command) {
        if (!this.isConnected || !this.writer) {
            throw new Error('Not connected to serial device');
        }

        try {
            // Create a unique command ID
            const cmdId = this.commandId++;
            
            // Create a promise that will be resolved when we get a response
            const responsePromise = new Promise((resolve) => {
                this.pendingCommands.set(cmdId, resolve);
            });

            // Encode and send the command
            const encoder = new TextEncoder();
            const data = encoder.encode(command + '\n');
            await this.writer.write(data);

            // Wait for response with timeout
            const response = await Promise.race([
                responsePromise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Command timeout')), 5000)
                )
            ]);

            return response;
        } catch (error) {
            console.error('Send command error:', error);
            throw error;
        }
    }

    async sendRaw(data) {
        if (!this.isConnected || !this.writer) {
            throw new Error('Not connected to serial device');
        }

        try {
            await this.writer.write(data);
        } catch (error) {
            console.error('Send raw data error:', error);
            throw error;
        }
    }

    // Send command without waiting for response (for jog commands, etc.)
    async sendCommandNoWait(command) {
        if (!this.isConnected || !this.writer) {
            throw new Error('Not connected to serial device');
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(command + '\n');
            await this.writer.write(data);
            
            // Log the sent command
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`> ${command}`, 'sent');
            }
        } catch (error) {
            console.error('Send command error:', error);
            throw error;
        }
    }

    // Check if serial is supported
    static isSupported() {
        return 'serial' in navigator;
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            portInfo: this.port ? {
                usbVendorId: this.port.getInfo().usbVendorId,
                usbProductId: this.port.getInfo().usbProductId
            } : null
        };
    }
}
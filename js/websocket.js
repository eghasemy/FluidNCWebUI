// WebSocket Communication Module for FluidNC WebUI
class WebSocketCommunication {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.pendingCommands = new Map();
        this.commandId = 0;
        this.url = '';
    }

    async connect(url) {
        return new Promise((resolve, reject) => {
            try {
                this.url = url;
                this.socket = new WebSocket(url);

                this.socket.onopen = () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    
                    if (window.fluidNCApp) {
                        window.fluidNCApp.addConsoleMessage('WebSocket connected', 'info');
                    }
                    
                    resolve();
                };

                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.socket.onclose = (event) => {
                    this.isConnected = false;
                    
                    if (window.fluidNCApp) {
                        if (event.wasClean) {
                            window.fluidNCApp.addConsoleMessage('WebSocket connection closed', 'info');
                        } else {
                            window.fluidNCApp.addConsoleMessage('WebSocket connection lost', 'error');
                            this.attemptReconnect();
                        }
                        window.fluidNCApp.updateConnectionStatus('disconnected');
                    }
                };

                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    
                    if (window.fluidNCApp) {
                        window.fluidNCApp.addConsoleMessage(`WebSocket error: ${error.message || 'Unknown error'}`, 'error');
                    }
                    
                    if (!this.isConnected) {
                        reject(new Error('WebSocket connection failed'));
                    }
                };

                // Connection timeout
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.socket.close();
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000);

            } catch (error) {
                reject(error);
            }
        });
    }

    async disconnect() {
        try {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
            
            if (this.socket && this.isConnected) {
                this.socket.close(1000, 'User initiated disconnect');
            }
            
            this.isConnected = false;
            this.socket = null;
            
            return true;
        } catch (error) {
            console.error('WebSocket disconnect error:', error);
            throw error;
        }
    }

    handleMessage(data) {
        try {
            // Ensure data is a string
            if (typeof data !== 'string') {
                data = String(data);
            }
            
            // Handle plain text messages (FluidNC sends simple text responses)
            const lines = data.split('\n');
            
            lines.forEach(line => {
                line = line.trim();
                if (line) {
                    // Parse the response first (this will handle filtering)
                    if (window.fluidNCApp) {
                        window.fluidNCApp.parseResponse(line);
                    }
                }
            });
        } catch (error) {
            console.error('Message handling error:', error);
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`Message handling error: ${error.message}`, 'error');
            }
        }
    }

    // Send ping to keep connection alive
    ping() {
        if (this.isConnected && this.socket) {
            try {
                // Send simple status query as ping
                this.socket.send('?');
            } catch (error) {
                console.error('Ping error:', error);
            }
        }
    }

    async sendCommand(command) {
        if (!this.isConnected || !this.socket) {
            throw new Error('Not connected to WebSocket');
        }

        try {
            // Send plain text command directly (FluidNC expects simple text commands)
            this.socket.send(command + '\n');
            
            // Log the sent command
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`> ${command}`, 'sent');
            }

            // For non-query commands, return immediately
            if (command !== '?' && !command.startsWith('$')) {
                return 'ok';
            }

            // For status queries and settings, wait briefly for response
            return new Promise((resolve) => {
                setTimeout(() => resolve('ok'), 100);
            });
        } catch (error) {
            console.error('Send command error:', error);
            throw error;
        }
    }

    async sendRaw(data) {
        if (!this.isConnected || !this.socket) {
            throw new Error('Not connected to WebSocket');
        }

        try {
            // Send raw data directly as text
            this.socket.send(data);
        } catch (error) {
            console.error('Send raw data error:', error);
            throw error;
        }
    }

    // Send command without waiting for response
    async sendCommandNoWait(command) {
        if (!this.isConnected || !this.socket) {
            throw new Error('Not connected to WebSocket');
        }

        try {
            // Send plain text command directly
            this.socket.send(command + '\n');
            
            // Log the sent command
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(`> ${command}`, 'sent');
            }
        } catch (error) {
            console.error('Send command error:', error);
            throw error;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage('Max reconnection attempts reached', 'error');
            }
            return;
        }

        this.reconnectAttempts++;
        
        if (window.fluidNCApp) {
            window.fluidNCApp.addConsoleMessage(
                `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 
                'info'
            );
        }

        setTimeout(() => {
            if (!this.isConnected && this.url) {
                this.connect(this.url).catch(() => {
                    // Reconnection failed, will try again if attempts remain
                    this.attemptReconnect();
                });
            }
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            url: this.url,
            readyState: this.socket ? this.socket.readyState : WebSocket.CLOSED,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    // Set reconnection parameters
    setReconnectionConfig(maxAttempts, delay) {
        this.maxReconnectAttempts = maxAttempts;
        this.reconnectDelay = delay;
    }

    // Send ping to keep connection alive
    ping() {
        if (this.isConnected && this.socket) {
            try {
                // Send simple status query as ping
                this.socket.send('?');
            } catch (error) {
                console.error('Ping error:', error);
            }
        }
    }

    // Start periodic ping
    startPing(interval = 30000) {
        this.pingInterval = setInterval(() => {
            this.ping();
        }, interval);
    }

    // Stop periodic ping
    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}
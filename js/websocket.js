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
            // Try to parse as JSON first (for structured messages)
            let message;
            try {
                message = JSON.parse(data);
                this.handleStructuredMessage(message);
            } catch {
                // If not JSON, treat as plain text response
                this.handleTextMessage(data);
            }
        } catch (error) {
            console.error('Message handling error:', error);
        }
    }

    handleStructuredMessage(message) {
        // Handle structured JSON messages
        if (message.type === 'response' && message.commandId !== undefined) {
            // Handle command response
            const resolver = this.pendingCommands.get(message.commandId);
            if (resolver) {
                resolver(message.data);
                this.pendingCommands.delete(message.commandId);
            }
        } else if (message.type === 'status') {
            // Handle status updates
            if (window.fluidNCApp) {
                window.fluidNCApp.parseResponse(message.data);
            }
        } else if (message.type === 'notification') {
            // Handle notifications
            if (window.fluidNCApp) {
                window.fluidNCApp.addConsoleMessage(message.data, 'info');
            }
        }
    }

    handleTextMessage(data) {
        // Handle plain text messages (like direct GRBL responses)
        const lines = data.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            if (line) {
                // Log the response
                if (window.fluidNCApp) {
                    // Don't log status reports to reduce console clutter
                    if (!line.startsWith('<') || !line.endsWith('>')) {
                        window.fluidNCApp.addConsoleMessage(line, 'received');
                    }
                    
                    // Parse the response
                    window.fluidNCApp.parseResponse(line);
                }
                
                // Handle command responses
                if (line === 'ok' || line.startsWith('error:')) {
                    const commandId = Array.from(this.pendingCommands.keys())[0];
                    if (commandId !== undefined) {
                        const resolver = this.pendingCommands.get(commandId);
                        if (resolver) {
                            resolver(line);
                            this.pendingCommands.delete(commandId);
                        }
                    }
                }
            }
        });
    }

    async sendCommand(command) {
        if (!this.isConnected || !this.socket) {
            throw new Error('Not connected to WebSocket');
        }

        try {
            const cmdId = this.commandId++;
            
            // Create a promise that will be resolved when we get a response
            const responsePromise = new Promise((resolve) => {
                this.pendingCommands.set(cmdId, resolve);
            });

            // Send the command - try structured format first
            const message = {
                type: 'command',
                commandId: cmdId,
                data: command
            };

            try {
                this.socket.send(JSON.stringify(message));
            } catch {
                // Fallback to plain text if structured format fails
                this.socket.send(command);
            }

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
        if (!this.isConnected || !this.socket) {
            throw new Error('Not connected to WebSocket');
        }

        try {
            // Send raw data - for special commands like emergency stop
            const message = {
                type: 'raw',
                data: data
            };

            try {
                this.socket.send(JSON.stringify(message));
            } catch {
                // Fallback to plain text
                this.socket.send(data);
            }
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
            const message = {
                type: 'command',
                data: command
            };

            try {
                this.socket.send(JSON.stringify(message));
            } catch {
                this.socket.send(command);
            }
            
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
                const pingMessage = {
                    type: 'ping',
                    timestamp: Date.now()
                };
                this.socket.send(JSON.stringify(pingMessage));
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
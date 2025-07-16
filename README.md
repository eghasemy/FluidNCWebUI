# FluidNC WebUI

A modern web-based user interface for controlling FluidNC CNC machines that matches the native FluidNC interface structure with enhanced probing capabilities.

![FluidNC WebUI Screenshot](https://github.com/user-attachments/assets/dfa20bac-eb4e-47e3-b613-8de3a0f1f5dd)

## Features

### Interface Structure
The interface is organized into logical panels matching FluidNC's native design:

- **Status Panel**: Machine state display with unlock, soft reset, sleep, and pause/resume controls
- **Jog Panel**: Position monitoring, jogging controls, homing, and work coordinate zeroing
- **Terminal Panel**: Command input/output with verbose mode and autoscroll controls
- **Files Panel**: Local, SD card, and flash file management
- **Macros Panel**: Quick macro execution and editing
- **Spindle Panel**: Spindle speed and direction controls
- **Overrides Panel**: Real-time feed rate, spindle speed, and rapid override controls
- **Probe Panel**: Enhanced probing capabilities with advanced routines

### Connection Options
- **USB Serial Communication**: Direct connection using Web Serial API (Chrome/Edge browsers)
- **WebSocket Communication**: Network connection with automatic reconnection and simplified protocol
- Real-time connection status monitoring

### Machine Control
- **Emergency Stop**: Immediate machine halt with Ctrl+X command
- **Soft Reset**: Safe machine reset with unlock sequence  
- **Machine Status**: Real-time display of machine state (Idle, Run, Hold, Alarm)
- **Homing**: Individual axis or all-axes homing routines
- **Jogging**: Precision jogging controls with step sizes from 0.01mm to 100mm
- **Work Coordinate System**: Zero individual axes or all axes

### Position Monitoring
- Real-time machine position (MPos) display
- Real-time work position (WPos) display
- Automatic status updates with optional verbose mode

### Terminal Features
- **Command Input**: Send custom G-code commands with send button
- **Console Output**: Monitor all machine communication
- **Verbose Mode Toggle**: Filter status reports to reduce clutter
- **Auto Scroll Control**: Pause/resume automatic scrolling
- **Clear Console**: Clear console history
- **Message Types**: Color-coded sent/received/error/info messages

### Files Management
- **Local Files**: Load G-code files from computer (.nc, .gcode, .txt, .tap)
- **SD Card**: Browse and manage SD card files (with FluidNC support)
- **Flash Storage**: Access flash-stored files
- **Job Control**: Start, pause, stop, and resume job execution
- **Progress Tracking**: Real-time progress bar and completion percentage

### Spindle & Overrides
- **Spindle Control**: Speed setting, CW/CCW rotation, and stop
- **Feed Rate Override**: -10%, -1%, +1%, +10%, and reset controls
- **Spindle Speed Override**: Real-time speed adjustment
- **Rapid Override**: 25%, 50%, and 100% rapid rate settings

### Macros
- **Quick Macros**: Four configurable macro buttons (Macro 0-3)
- **Macro Editor**: Built-in editor for creating and modifying macros
- **Execution**: One-click macro execution

### Enhanced Probing System

#### Probe Parameters
Configure all probing parameters through the UI:
- Rapid feed rate (mm/min)
- Search feed rate (mm/min) 
- Latch feed rate (mm/min)
- Maximum probing distance (mm)
- Latch distance (mm)
- Probe diameter (mm)
- XY clearance (mm)
- Z probing depth (mm)

#### Edge Finding
- Top Edge probing
- Bottom Edge probing  
- Left Edge probing
- Right Edge probing

#### Corner Finding
- Top-Left corner probing
- Top-Right corner probing
- Bottom-Left corner probing
- Bottom-Right corner probing

#### Center Finding
- **External Center**: Find center of external features/parts
- **Internal Center**: Find center of internal holes/features
- Configurable diameter parameters for both external and internal features

#### Height Mapping
- **Grid-based Surface Scanning**: Configurable grid size (2x2 to 20x20)
- **Area Definition**: Set scanning area dimensions
- **Height Data Collection**: Automatic Z-probing at each grid point
- **G-code Compensation**: Apply height map to loaded G-code for surface following
- **Export**: Save height map data as JSON

#### Rotation Detection
- **Two-Point Edge Detection**: Probe two points to detect part rotation
- **Angle Calculation**: Automatic calculation of rotation angle
- **G-code Compensation**: Apply rotation correction to loaded G-code
- **Real-time Display**: Show detected angle in degrees

### Configuration Management
- **Config Editor**: Full config.yaml editing with syntax highlighting
- **Load from FluidNC**: Retrieve current configuration from device
- **Save to FluidNC**: Upload modified configuration
- **File Import/Export**: Load from file or download configuration
- **FluidNC Restart**: Restart device to apply configuration changes

## Design Philosophy

### Clean Interface
- No colored button backgrounds (only colored borders and icons)
- Consistent spacing and typography
- Responsive design for desktop, tablet, and mobile
- Panel-based organization for easy navigation

### Browser Compatibility

#### USB Serial (Recommended)
- Chrome 89+
- Edge 89+
- Opera 75+

#### WebSocket
- All modern browsers
- Requires WebSocket server on FluidNC device

## Getting Started

1. **Open the WebUI**: Navigate to `index.html` in your browser
2. **Choose Connection Type**: Select USB Serial or WebSocket
3. **Connect**: 
   - USB: Click "Connect USB" and select your FluidNC device
   - WebSocket: Enter the WebSocket URL (e.g., `ws://192.168.1.100:80/ws`) and click "Connect"
4. **Configure Settings**: Use the terminal verbose mode and other options as needed
5. **Configure Probe Parameters**: Set your probe parameters in the Probe panel
6. **Start Using**: Begin with homing, then use jogging and probing features

## Advanced Features

### Configuration Editor
Access the configuration editor via the "Config Editor" button in the header:
- Edit config.yaml directly in the browser
- Load current configuration from FluidNC
- Save changes back to FluidNC
- Import/export configuration files
- Restart FluidNC to apply changes

### Probing Workflows

#### Basic Edge/Corner Probing
1. Position probe near the feature to be probed
2. Set appropriate probe parameters
3. Click the desired probing routine button
4. The machine will automatically probe and set work coordinates

#### Height Mapping Workflow
1. Load your G-code file
2. Position the probe at the starting corner of the area to be mapped
3. Configure grid size and area dimensions
4. Click "Generate Height Map"
5. Wait for the probing sequence to complete
6. Click "Apply Height Map to G-code" to compensate the loaded G-code

#### Rotation Compensation Workflow
1. Load your G-code file
2. Position the probe to detect an edge of your part
3. Click "Detect Rotation"
4. The system will probe two points and calculate rotation
5. Click "Apply Rotation to G-code" to compensate the loaded G-code

## File Structure

```
FluidNCWebUI/
├── index.html          # Main interface
├── config.html         # Configuration editor
├── css/
│   └── styles.css      # Modern responsive styling
├── js/
│   ├── app.js          # Main application logic
│   ├── serial.js       # USB Serial communication
│   ├── websocket.js    # Simplified WebSocket communication  
│   ├── gcode.js        # G-code management & transformation
│   └── probing.js      # Enhanced probing routines
└── FluidNC-Probing/    # G-code templates for probing
    ├── 00-Probing-Parameters.nc
    ├── 01-Centre.nc
    ├── 02-Bottom-Edge.nc
    └── ... (other probing files)
```

## Technical Details

### WebSocket Communication
The WebSocket implementation uses a simplified protocol that sends plain text commands directly to FluidNC, avoiding timeout issues caused by complex JSON messaging.

### Parameter Persistence
- Probe parameters are automatically saved to browser localStorage
- UI preferences (verbose mode, autoscroll) are preserved between sessions
- Connection settings are remembered

### Responsive Design
The interface adapts to different screen sizes:
- Desktop: Multi-column panel layout
- Tablet: Responsive grid that adapts to screen width
- Mobile: Single-column layout with optimized controls

## Future Enhancements

Planned features include:
- [ ] 3D G-code visualizer (similar to cncjs)
- [ ] UI configuration page for customizable panel layouts
- [ ] Additional probing routines
- [ ] Integration with FluidNC's native SD card browser
- [ ] Real-time feed rate and override displays

## Safety Notes

⚠️ **Important Safety Information**
- Always ensure proper probe connection before starting any probing routine
- Set appropriate probing distances to avoid crashes
- Test probing routines with safe parameters first
- Keep the Emergency Stop button easily accessible
- Ensure adequate clearance around the probe and workpiece

## Contributing

This WebUI is designed to be easily extensible. Key areas for contribution:
- Additional probing routines
- Enhanced G-code processing
- UI improvements
- 3D visualization features
- Additional machine compatibility

## License

[License information to be added]
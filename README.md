# FluidNC WebUI

A modern web-based user interface for controlling FluidNC CNC machines with enhanced probing capabilities.

![FluidNC WebUI Screenshot](https://github.com/user-attachments/assets/dfa20bac-eb4e-47e3-b613-8de3a0f1f5dd)

## Features

### Connection Options
- **USB Serial Communication**: Direct connection using Web Serial API (Chrome/Edge browsers)
- **WebSocket Communication**: Network connection with automatic reconnection
- Real-time connection status monitoring

### Machine Control
- **Emergency Stop**: Immediate machine halt with Ctrl+X command
- **Soft Reset**: Safe machine reset with unlock sequence
- **Homing**: Individual axis or all-axes homing routines
- **Jogging**: Precision jogging controls with configurable step sizes (0.1mm to 100mm)
- **Work Coordinate System**: Zero individual axes or all axes

### Position Monitoring
- Real-time machine position (MPos) display
- Real-time work position (WPos) display
- Automatic status updates every second when connected

### G-code Management
- **File Loading**: Load G-code files (.nc, .gcode, .txt)
- **Job Control**: Start, pause, stop, and resume job execution
- **Progress Tracking**: Real-time progress bar and line counting
- **G-code Viewer**: Built-in text editor for viewing and editing
- **Export**: Save modified G-code files

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

### Console Interface
- **Command Input**: Send custom G-code commands
- **Response Monitoring**: View all machine responses
- **Message Filtering**: Automatic filtering of status reports to reduce clutter
- **Command History**: Navigate previous commands with keyboard
- **Timestamp Logging**: All messages include timestamps

## Browser Compatibility

### USB Serial (Recommended)
- Chrome 89+
- Edge 89+
- Opera 75+

### WebSocket
- All modern browsers
- Requires WebSocket server on FluidNC device

## Getting Started

1. **Open the WebUI**: Navigate to `index.html` in your browser
2. **Choose Connection Type**: Select USB Serial or WebSocket
3. **Connect**: 
   - USB: Click "Connect USB" and select your FluidNC device
   - WebSocket: Enter the WebSocket URL (e.g., `ws://192.168.1.100:80/ws`) and click "Connect"
4. **Configure Probe Parameters**: Set your probe parameters in the Enhanced Probing section
5. **Start Using**: Begin with homing, then use jogging and probing features

## Probing Workflow

### Basic Edge/Corner Probing
1. Position probe near the feature to be probed
2. Set appropriate probe parameters
3. Click the desired probing routine button
4. The machine will automatically probe and set work coordinates

### Height Mapping Workflow
1. Load your G-code file
2. Position the probe at the starting corner of the area to be mapped
3. Configure grid size and area dimensions
4. Click "Generate Height Map"
5. Wait for the probing sequence to complete
6. Click "Apply Height Map to G-code" to compensate the loaded G-code

### Rotation Compensation Workflow
1. Load your G-code file
2. Position the probe to detect an edge of your part
3. Click "Detect Rotation"
4. The system will probe two points and calculate rotation
5. Click "Apply Rotation to G-code" to compensate the loaded G-code

## File Structure

```
FluidNCWebUI/
├── index.html          # Main HTML interface
├── css/
│   └── styles.css      # CSS styling
├── js/
│   ├── app.js          # Main application logic
│   ├── serial.js       # USB Serial communication
│   ├── websocket.js    # WebSocket communication  
│   ├── gcode.js        # G-code management
│   └── probing.js      # Enhanced probing routines
└── FluidNC-Probing/    # G-code templates for probing
    ├── 00-Probing-Parameters.nc
    ├── 01-Centre.nc
    ├── 02-Bottom-Edge.nc
    └── ... (other probing files)
```

## Configuration

### Probe Parameters Storage
Probe parameters are automatically saved to browser localStorage and restored on page reload.

### WebSocket Configuration
For WebSocket connections, the typical FluidNC WebSocket URL format is:
```
ws://[IP_ADDRESS]:80/ws
```

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
- Additional machine compatibility

## License

[License information to be added]
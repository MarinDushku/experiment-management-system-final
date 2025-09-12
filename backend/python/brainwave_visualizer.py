import sys
import json
import numpy as np
import threading
import time
import os
import signal
import argparse
from collections import deque
import select
import math
import csv
from io import StringIO

# Try to force a good interactive backend
try:
    import matplotlib
    # Test PyQt5 first - best for Windows
    try:
        import PyQt5
        matplotlib.use('Qt5Agg')
        print("Using Qt5Agg backend")
    except ImportError:
        # Try TkAgg as fallback
        matplotlib.use('TkAgg')
        print("Using TkAgg backend")
        
    import matplotlib.pyplot as plt
    from matplotlib.animation import FuncAnimation
    from matplotlib.gridspec import GridSpec
    import matplotlib.patches as patches
    from matplotlib.colors import LinearSegmentedColormap
    
    # Check matplotlib version for proper GridSpec nesting
    MATPLOTLIB_VERSION = matplotlib.__version__
    print(f"Using matplotlib version {MATPLOTLIB_VERSION}")
    
    # Try to import scipy for signal processing
    try:
        from scipy import signal as sig_processing
        SCIPY_AVAILABLE = True
        print("Using scipy for signal processing")
    except ImportError:
        SCIPY_AVAILABLE = False
        print("Scipy not available. Signal processing will be limited.")
        
    MATPLOTLIB_AVAILABLE = True
except ImportError as e:
    print(f"Matplotlib import error: {e}")
    MATPLOTLIB_AVAILABLE = False

# Global constants
VERTICAL_SCALE = 200.0      # Default μV scale (adjustable)
TIME_WINDOW = 5.0           # Default time window in seconds (adjustable)
SAMPLE_RATE = 250           # OpenBCI sample rate (Hz)
BUFFER_SIZE = int(SAMPLE_RATE * TIME_WINDOW * 2)  # 2x buffer for smooth display
COLORS = {
    'background': '#111111',
    'grid': '#333333',
    'text': '#FFFFFF',
    'header': '#2E4053',
    'channels': [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00',  # Channels 1-4 (red, green, blue, yellow)
        '#FF00FF', '#00FFFF', '#FF8000', '#8000FF',  # Channels 5-8 (magenta, cyan, orange, purple)
        '#FF0080', '#00FF80', '#0080FF', '#80FF00',  # Channels 9-12
        '#800080', '#008080', '#804000', '#408000'   # Channels 13-16
    ]
}

# Global variables
data_buffer = deque(maxlen=10000)  # Main data buffer
running = True                     # App running flag
stream_active = False              # Data streaming flag 
axes = []                          # Store all subplot axes
channel_count = 16                 # Default to 16 channels (cyton_daisy)
sample_count = 0                   # Count received samples
railed_percentages = [0] * 16       # Track "railed" percentage for each channel
is_data_flowing = False             # Track if data is flowing
last_update_time = time.time()      # Last UI update time
fps_counter = 0                     # Track FPS
start_time = None                   # Session start time

# Global variables for enhanced functionality
fft_data = {}                       # Store FFT data for each channel
smoothing_enabled = True            # Smoothing toggle
filter_enabled = True               # Filter toggle
max_frequency = 60                  # Maximum frequency to display in FFT (Hz)
max_uv_fft = 100                    # Maximum amplitude for FFT display (uV)
head_map_data = [0] * 16            # Data for head map visualization

# UI elements that need global access
status_time_text = None
status_info_text = None
status_fps_text = None
lines = []
rms_texts = []
signal_indicators = []
fft_ax = None
fft_lines = []
head_ax = None
head_circles = []
buttons = []
smooth_button = None
filter_button = None
start_button = None
data_thread = None
test_thread = None
csv_thread = None

# Function to format time (HH:MM:SS)
def format_time():
    """Format current time as HH:MM:SS"""
    t = time.localtime()
    return f"{t.tm_hour:02d}:{t.tm_min:02d}:{t.tm_sec:02d}"

# Function to format elapsed time
def format_elapsed_time():
    """Format elapsed time as MM:SS"""
    if start_time is None:
        return "00:00"
    elapsed = time.time() - start_time
    minutes = int(elapsed // 60)
    seconds = int(elapsed % 60)
    return f"{minutes:02d}:{seconds:02d}"

# Clean shutdown handler
def signal_handler(sig, frame):
    """Handle Ctrl+C and other termination signals"""
    global running
    print("Visualization terminated by signal")
    running = False
    plt.close('all')
    sys.exit(0)

# Simple bandpass filter implementation
def apply_bandpass(data, lowcut=1.0, highcut=50.0, fs=SAMPLE_RATE, order=4):
    """Apply a bandpass filter to the signal"""
    global filter_enabled
    
    if not filter_enabled or len(data) < 10:
        return data
    
    if SCIPY_AVAILABLE:
        nyq = 0.5 * fs
        low = lowcut / nyq
        high = highcut / nyq
        
        b, a = sig_processing.butter(order, [low, high], btype='band')
        filtered_data = sig_processing.filtfilt(b, a, data)
        
        return filtered_data
    else:
        # Simplified filtering if scipy not available
        return data

# Calculate FFT for visualization
def calculate_fft(data, fs=SAMPLE_RATE):
    """Calculate FFT for visualization"""
    if len(data) < fs//2:  # Need at least half a second of data
        return np.zeros(fs//2), np.zeros(fs//2)
    
    # Apply window function to reduce spectral leakage
    windowed_data = data * np.hamming(len(data))
    
    # Calculate FFT
    n = len(windowed_data)
    fft_result = np.abs(np.fft.rfft(windowed_data))/n
    
    # Get frequency bins
    freqs = np.fft.rfftfreq(n, 1/fs)
    
    # Limit to max_frequency
    mask = freqs <= max_frequency
    return freqs[mask], fft_result[mask]

# Thread to read data from stdin
def read_data_from_stdin():
    """Read EEG data from stdin (sent by OpenBCI bridge)"""
    global running, data_buffer, sample_count, is_data_flowing, stream_active
    
    print("Data input thread started")
    buffer_clear_time = time.time()
    
    while running:
        if not stream_active:
            time.sleep(0.1)  # Sleep while streaming is paused
            continue
            
        try:
            # Platform-specific reading approach
            if os.name == 'nt':  # Windows
                line = sys.stdin.readline().strip()
                if line:
                    try:
                        data = json.loads(line)
                        # Store with timestamp
                        data_buffer.append((time.time(), data))
                        sample_count += 1
                        is_data_flowing = True
                    except json.JSONDecodeError:
                        # Try as CSV
                        try:
                            csv_data = list(csv.reader(StringIO(line)))[0]
                            if len(csv_data) >= 17:  # Timestamp + 16 channels
                                timestamp = float(csv_data[0])
                                values = [float(x) for x in csv_data[1:17]]
                                data_buffer.append((timestamp, values))
                                sample_count += 1
                                is_data_flowing = True
                        except:
                            pass
            else:  # Unix-like platforms
                if sys.stdin in select.select([sys.stdin], [], [], 0.001)[0]:
                    line = sys.stdin.readline().strip()
                    if line:
                        try:
                            data = json.loads(line)
                            # Store with timestamp
                            data_buffer.append((time.time(), data))
                            sample_count += 1
                            is_data_flowing = True
                        except json.JSONDecodeError:
                            # Try as CSV
                            try:
                                csv_data = list(csv.reader(StringIO(line)))[0]
                                if len(csv_data) >= 17:  # Timestamp + 16 channels
                                    timestamp = float(csv_data[0])
                                    values = [float(x) for x in csv_data[1:17]]
                                    data_buffer.append((timestamp, values))
                                    sample_count += 1
                                    is_data_flowing = True
                            except:
                                pass
            
            # Reset "is_data_flowing" flag if no data received for 1 second
            if time.time() - buffer_clear_time > 1.0:
                if is_data_flowing:
                    print(f"Data rate: {sample_count / (time.time() - buffer_clear_time):.1f} samples/sec")
                is_data_flowing = False
                sample_count = 0
                buffer_clear_time = time.time()
                
            # Small delay to prevent high CPU usage
            time.sleep(0.001)
        except Exception as e:
            if "EOF" not in str(e):
                print(f"Error reading data: {e}")
            time.sleep(0.01)
    
    print("Data input thread stopped")

# Process CSV data
def process_csv(file_path):
    """Process a CSV file with EEG data"""
    global running, data_buffer, stream_active
    
    print(f"CSV processing thread started, reading from {file_path}")
    
    try:
        with open(file_path, 'r') as f:
            # Skip header
            header = f.readline()
            
            # Process data rows
            while running:
                if not stream_active:
                    time.sleep(0.1)  # Sleep while streaming is paused
                    continue
                    
                line = f.readline()
                if not line:  # EOF
                    time.sleep(0.1)  # Sleep before checking again (for live files)
                    continue
                    
                try:
                    csv_data = list(csv.reader(StringIO(line)))[0]
                    if len(csv_data) >= 17:  # Timestamp + 16 channels
                        timestamp = float(csv_data[0])
                        values = [float(x) for x in csv_data[1:17]]
                        data_buffer.append((timestamp, values))
                except Exception as e:
                    print(f"Error processing CSV line: {e}")
                
                # Control replay speed
                time.sleep(1.0 / (SAMPLE_RATE * 1.0))  # 1.0x speed
                
    except Exception as e:
        print(f"Error in CSV processing: {e}")
    
    print("CSV processing thread stopped")

# Calculate signal quality metrics
def analyze_signal(channel_data):
    """Analyze signal for quality metrics"""
    if len(channel_data) < 10:
        return 0.0, 0.0, 0.0
        
    # Convert to numpy array
    data = np.array(channel_data)
    
    # Calculate RMS value
    rms = np.sqrt(np.mean(np.square(data)))
    
    # Calculate rail percentage (how often signal hits extremes)
    rail_threshold = VERTICAL_SCALE * 0.95
    railed_samples = np.sum(np.abs(data) > rail_threshold)
    rail_percentage = 100 * railed_samples / len(data) if len(data) > 0 else 0
    
    # Calculate variance (for noise estimation)
    variance = np.var(data)
    
    return rms, rail_percentage, variance

# Update function for matplotlib animation
def update_plot(frame):
    """Update the visualization with new data"""
    global data_buffer, railed_percentages, fps_counter, last_update_time
    global fft_data, head_map_data, fft_ax, fft_lines, head_circles, smoothing_enabled
    
    # Track FPS
    current_time = time.time()
    fps_counter += 1
    if current_time - last_update_time >= 1.0:
        fps = fps_counter / (current_time - last_update_time)
        status_fps_text.set_text(f"FPS: {fps:.0f}")
        fps_counter = 0
        last_update_time = current_time
    
    # Get data for display window
    display_data = {}
    rail_counts = {}
    
    # Current window timeframe
    now = time.time()
    window_start = now - TIME_WINDOW
    
    # Initialize processing arrays
    for ch in range(channel_count):
        display_data[ch] = {'times': [], 'values': []}
        rail_counts[ch] = {'count': 0, 'total': 0}
    
    # Process data in buffer for display
    if len(data_buffer) > 0:
        # Extract data within our time window
        for timestamp, values in data_buffer:
            if timestamp >= window_start:
                rel_time = timestamp - now  # Time relative to now (negative values)
                
                for ch in range(min(channel_count, len(values))):
                    val = values[ch]
                    display_data[ch]['times'].append(rel_time)
                    display_data[ch]['values'].append(val)
                    
                    # Track if sample is railed
                    rail_counts[ch]['total'] += 1
                    if abs(val) > VERTICAL_SCALE * 0.95:
                        rail_counts[ch]['count'] += 1
    
    # Updated artists list
    updated_artists = []
    
    # Update all channel plots and calculate FFT data
    for ch in range(channel_count):
        # Update line data
        if len(display_data[ch]['times']) > 0:
            # Get channel data as numpy array for processing
            times = np.array(display_data[ch]['times'])
            values = np.array(display_data[ch]['values'])
            
            # Apply filtering if enabled
            if filter_enabled and len(values) > 10:
                filtered_values = apply_bandpass(values)
            else:
                filtered_values = values
            
            # Apply smoothing if enabled
            if smoothing_enabled and len(filtered_values) > 3:
                # Simple moving average smoothing
                window_size = 5
                smoothed_values = np.convolve(filtered_values, np.ones(window_size)/window_size, mode='same')
            else:
                smoothed_values = filtered_values
            
            # Update main time series plot
            lines[ch].set_data(times, smoothed_values)
            updated_artists.append(lines[ch])
            
            # Calculate metrics on original (unsmoothed) data
            rms, rail_pct, var = analyze_signal(values)
            
            # Smooth railed percentage
            if rail_counts[ch]['total'] > 0:
                current_rail_pct = 100 * rail_counts[ch]['count'] / rail_counts[ch]['total']
                railed_percentages[ch] = 0.7 * railed_percentages[ch] + 0.3 * current_rail_pct
            
            # Update RMS text with rail percentage (like OpenBCI GUI)
            rms_color = 'white'
            rail_text = ""
            
            if railed_percentages[ch] > 90:
                rail_text = f"Railed {railed_percentages[ch]:.2f}% "
                rms_color = 'red'
            elif railed_percentages[ch] > 50:
                rail_text = f"Near Railed {railed_percentages[ch]:.2f}% "
                rms_color = 'yellow'
            elif railed_percentages[ch] > 1:
                rail_text = f"Railed {railed_percentages[ch]:.2f}% "
                rms_color = 'red'
            
            # Update RMS text display
            rms_texts[ch].set_text(f"{rail_text}{rms:.2f} µVrms")
            rms_texts[ch].set_color(rms_color)
            updated_artists.append(rms_texts[ch])
            
            # Update channel signal indicators
            if rms < 0.1:  # No signal
                signal_indicators[ch].set_color('#555555')
            elif railed_percentages[ch] > 50:  # Railed signal
                signal_indicators[ch].set_color('red')
            elif rms > 50:  # Strong signal
                signal_indicators[ch].set_color('lime')
            else:  # Normal signal
                signal_indicators[ch].set_color('green')
            updated_artists.append(signal_indicators[ch])
            
            # Calculate FFT for this channel if we have enough data
            if len(values) > SAMPLE_RATE//4:  # At least 1/4 second of data
                freqs, fft_vals = calculate_fft(values)
                fft_data[ch] = {'freqs': freqs, 'values': fft_vals}
                
                # Store signal strength for head map
                head_map_data[ch] = rms
    
    # Update FFT plot
    if fft_ax is not None and len(fft_data) > 0:
        for ch in range(min(channel_count, len(fft_lines))):
            if ch in fft_data and len(fft_data[ch]['freqs']) > 0:
                fft_lines[ch].set_data(fft_data[ch]['freqs'], fft_data[ch]['values'])
                updated_artists.append(fft_lines[ch])
    
    # Update head map
    if head_circles and len(head_circles) > 0:
        update_head_map(head_map_data)
        updated_artists.extend(head_circles)
    
    # Update status text
    status_time_text.set_text(f"Time: {format_time()}")
    status_info_text.set_text(f"Runtime: {format_elapsed_time()} | Sample Rate: {SAMPLE_RATE} Hz")
    updated_artists.extend([status_time_text, status_info_text, status_fps_text])
    
    return updated_artists

# New function to update head map
def update_head_map(data):
    """Update the head map visualization with current channel data"""
    global head_circles, railed_percentages, channel_count
    
    if not head_circles or len(head_circles) == 0:
        return
    
    # Normalize data for visualization
    normalized_data = np.array(data)
    max_val = max(0.1, np.max(normalized_data))  # Avoid division by zero
    normalized_data = normalized_data / max_val
    
    # Update head map colors
    for ch in range(min(channel_count, len(head_circles))):
        val = normalized_data[ch]
        # Skip updating if no data
        if val <= 0:
            continue
            
        # Color based on signal strength and rail status
        if railed_percentages[ch] > 50:
            color = [1.0, 0.0, 0.0, val]  # Red for railed (with alpha for intensity)
        else:
            # Blue-to-red colormap for normal signal
            color = [val, 0.0, 1.0-val, val]
            
        head_circles[ch].set_alpha(val)
        if val > 0.1:  # Only show strong signals
            head_circles[ch].set_color(color)

# Button callbacks
def toggle_data_stream(event):
    """Toggle data stream on/off"""
    global stream_active, start_button, data_thread, test_thread, csv_thread
    
    stream_active = not stream_active
    
    if stream_active:
        start_button.label.set_text('Stop Data Stream')
        start_button.color = 'salmon'
        print("Data stream started")
    else:
        start_button.label.set_text('Start Data Stream')
        start_button.color = 'lightgreen'
        print("Data stream stopped")

def toggle_smoothing(event):
    """Toggle smoothing on/off"""
    global smoothing_enabled, smooth_button
    smoothing_enabled = not smoothing_enabled
    if smooth_button:
        smooth_button.label.set_text('Smoothing On' if smoothing_enabled else 'Smoothing Off')
        smooth_button.color = 'lightblue' if smoothing_enabled else 'lightgray'

def toggle_filter(event):
    """Toggle filtering on/off"""
    global filter_enabled, filter_button
    filter_enabled = not filter_enabled
    if filter_button:
        filter_button.color = 'lightblue' if filter_enabled else 'lightgray'

# Create button UI elements
def create_control_buttons(fig):
    """Create interactive buttons for the UI"""
    global smoothing_enabled, filter_enabled, smooth_button, filter_button, start_button
    
    # Create axes for buttons
    button_y = 0.01
    button_height = 0.05
    
    # Start/Stop Button
    start_button_ax = fig.add_axes([0.02, button_y, 0.15, button_height])
    start_button = plt.Button(start_button_ax, 'Start Data Stream', color='lightgreen')
    
    # Filters Button
    filter_button_ax = fig.add_axes([0.18, button_y, 0.10, button_height])
    filter_button = plt.Button(filter_button_ax, 'Filters', color='lightblue')
    
    # Smoothing Button
    smooth_text = 'Smoothing On' if smoothing_enabled else 'Smoothing Off'
    smooth_color = 'lightblue' if smoothing_enabled else 'lightgray'
    smooth_button_ax = fig.add_axes([0.29, button_y, 0.15, button_height])
    smooth_button = plt.Button(smooth_button_ax, smooth_text, color=smooth_color)
    
    # Settings Button
    settings_button_ax = fig.add_axes([0.78, button_y, 0.10, button_height])
    settings_button = plt.Button(settings_button_ax, 'Settings', color='lightblue')
    
    # Layout Button
    layout_button_ax = fig.add_axes([0.89, button_y, 0.10, button_height])
    layout_button = plt.Button(layout_button_ax, 'Layout', color='lightblue')
    
    # Connect callbacks
    start_button.on_clicked(toggle_data_stream)
    smooth_button.on_clicked(toggle_smoothing)
    filter_button.on_clicked(toggle_filter)
    
    return [start_button, filter_button, smooth_button, settings_button, layout_button]

# Generate test data for development when no input is available
def generate_test_data():
    """Generate simulated EEG data for testing the visualizer"""
    global data_buffer, running, stream_active
    
    print("Generating test data...")
    base_freq = 10  # Base frequency in Hz
    
    while running:
        if not stream_active:
            time.sleep(0.1)  # Sleep while streaming is paused
            continue
            
        current_time = time.time()
        
        # Generate 16 channels of test data with different characteristics
        data = []
        for ch in range(16):
            # Different frequency for each channel
            freq = base_freq + (ch * 1.5)
            
            # Amplitude varies by channel
            amp = 30 + (ch * 5) % 150
            
            # Add some randomness
            noise = np.random.normal(0, 10)
            
            # Generate value
            value = amp * np.sin(2 * np.pi * freq * (current_time % 1)) + noise
            
            # Every third channel gets occasional railing
            if ch % 3 == 0 and np.random.random() < 0.1:
                value = VERTICAL_SCALE * 0.98 * np.sign(value)
                
            data.append(value)
        
        # Add to buffer
        data_buffer.append((current_time, data))
        
        # Sleep to simulate realistic sample rate
        time.sleep(1.0 / SAMPLE_RATE)
    
    print("Test data generation stopped")

# Main visualization function (enhanced)
def start_visualization(board_type='cyton', experiment_name='Unnamed Experiment'):
    """Start the enhanced EEG visualization"""
    global running, axes, channel_count, start_time
    global lines, rms_texts, signal_indicators
    global status_time_text, status_info_text, status_fps_text
    global fft_ax, fft_lines, head_ax, head_circles, buttons
    global smooth_button, filter_button, start_button
    
    if not MATPLOTLIB_AVAILABLE:
        print("ERROR: Matplotlib is not available. Visualization cannot start.")
        return
    
    # Set channel count based on board type
    channel_count = 16 if board_type.lower() == 'cyton_daisy' else 8
    print(f"Starting visualization with {channel_count} channels for experiment: {experiment_name}")
    
    try:
        # Set up signal handlers for clean exit
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Record start time
        start_time = time.time()
        
        # Configure plot appearance
        plt.style.use('dark_background')
        
        # Create figure
        fig = plt.figure(figsize=(14, 10), facecolor=COLORS['background'])
        fig.canvas.manager.set_window_title(f"OpenBCI EEG Visualization - {experiment_name}")
        
        # Create layout using a different approach to avoid nested GridSpec issues
        # We'll use the figure's add_subplot method with explicit positioning
        
        # Calculate grid positions for all elements
        left_panel_width = 0.65
        right_panel_width = 0.33
        header_height = 0.05
        footer_height = 0.05
        
        # Calculate channel height based on number of channels
        total_channels_height = 1.0 - header_height - footer_height
        channel_height = total_channels_height / channel_count
        
        # Time series header
        header_ax = fig.add_axes([0.02, 0.95, left_panel_width, header_height])
        header_ax.set_facecolor(COLORS['header'])
        header_ax.axis('off')
        
        # Add status text elements
        status_info_text = header_ax.text(0.01, 0.5, f"Runtime: 00:00 | Sample Rate: {SAMPLE_RATE} Hz", 
                                   transform=header_ax.transAxes, va='center', fontsize=10, color='white')
        status_time_text = header_ax.text(0.5, 0.5, f"Time: {format_time()}", 
                                  transform=header_ax.transAxes, ha='center', va='center', fontsize=10, color='white')
        status_fps_text = header_ax.text(0.99, 0.5, "FPS: 0", 
                                transform=header_ax.transAxes, ha='right', va='center', fontsize=10, color='white')
        
        # Time series footer
        footer_ax = fig.add_axes([0.02, 0.02, left_panel_width, footer_height])
        footer_ax.set_facecolor(COLORS['header'])
        footer_ax.axis('off')
        
        # Initialize arrays to store plot elements
        axes = []          # All subplot axes
        lines = []         # Line objects for each channel
        rms_texts = []     # Text objects for RMS values
        signal_indicators = []  # Signal quality indicators
        
        # Create channel subplots for time series
        for i in range(channel_count):
            # Calculate position from top to bottom
            top_position = 0.95 - header_height - (i * channel_height)
            
            # Create subplot
            ax = fig.add_axes([0.02, top_position - channel_height, left_panel_width, channel_height])
            axes.append(ax)
            
            # Configure subplot appearance
            ax.set_facecolor(COLORS['background'])
            ax.set_xlim(-TIME_WINDOW, 0)
            ax.set_ylim(-VERTICAL_SCALE, VERTICAL_SCALE)
            ax.grid(True, color=COLORS['grid'], linestyle='-', alpha=0.5)
            
            # Channel label with circle indicator
            ax.set_ylabel(f"Ch {i+1}", rotation=0, labelpad=25, fontsize=9, color='white')
            
            # Scale markers
            ax.text(-0.01, VERTICAL_SCALE*0.85, f"+{VERTICAL_SCALE}µV", 
                   transform=ax.transAxes, ha='right', va='center', fontsize=8, color='white')
            ax.text(-0.01, 0.15, f"-{VERTICAL_SCALE}µV", 
                   transform=ax.transAxes, ha='right', va='center', fontsize=8, color='white')
            
            # Only show x-axis on bottom channel
            if i < channel_count - 1:
                ax.set_xticklabels([])
            else:
                ax.set_xlabel("Time (s)")
            
            # Create channel line with appropriate color
            line, = ax.plot([], [], lw=1.2, color=COLORS['channels'][i])
            lines.append(line)
            
            # Add zero line
            ax.axhline(y=0, color='gray', linestyle='-', alpha=0.3)
            
            # Add quality indicator
            quality = ax.add_patch(patches.Circle((0.98, 0.1), 0.02, 
                                               transform=ax.transAxes, color='green'))
            signal_indicators.append(quality)
            
            # Add RMS text
            rms = ax.text(0.97, 0.9, "0.00 µVrms", transform=ax.transAxes,
                        ha='right', va='center', fontsize=9, color='white')
            rms_texts.append(rms)
        
        # Create FFT plot in right column
        fft_ax = fig.add_axes([0.70, 0.55, right_panel_width, 0.35])
        fft_ax.set_title("FFT Plot", color='white')
        fft_ax.set_xlim(0, max_frequency)
        fft_ax.set_ylim(0.1, max_uv_fft)
        fft_ax.set_yscale('log')  # Log scale for better visualization
        fft_ax.set_xlabel("Frequency (Hz)")
        fft_ax.set_ylabel("Amplitude (µV)")
        fft_ax.grid(True, color=COLORS['grid'], linestyle='-', alpha=0.5)
        
# Create FFT lines for each channel
        fft_lines = []
        for i in range(channel_count):
            fft_line, = fft_ax.plot([], [], lw=1.5, color=COLORS['channels'][i])
            fft_lines.append(fft_line)
        
        # Create head map visualization
        head_ax = fig.add_axes([0.70, 0.10, right_panel_width, 0.35])
        head_ax.set_title("Head Plot", color='white')
        head_ax.set_xlim(-1.2, 1.2)
        head_ax.set_ylim(-1.2, 1.2)
        head_ax.axis('off')
        
        # Create head outline
        head_circle = patches.Circle((0, 0), 1.0, fill=False, color='white', linewidth=2)
        head_ax.add_patch(head_circle)
        
        # Add nose indicator
        nose = patches.Polygon([[-0.1, 1.0], [0, 1.1], [0.1, 1.0]], color='white')
        head_ax.add_patch(nose)
        
        # Define channel positions on head (using 10-20 system approximation)
        channel_positions = [
            # Ch 1-8 (outer ring)
            [-0.4, 0.8], [0.4, 0.8],   # 1, 2 (Fp1, Fp2)
            [-0.8, 0.4], [0.8, 0.4],   # 3, 4 (F7, F8)
            [-0.8, -0.4], [0.8, -0.4], # 5, 6 (T3, T4)
            [-0.4, -0.8], [0.4, -0.8], # 7, 8 (P3, P4)
            
            # Ch 9-16 (inner ring and central)
            [-0.25, 0.5], [0.25, 0.5], # 9, 10 (F3, F4)
            [0, 0],                    # 11 (Cz)
            [0, -0.5],                 # 12 (Pz)
            [-0.5, 0],                 # 13 (C3)
            [0.5, 0],                  # 14 (C4)
            [-0.5, -0.5],              # 15 (P3)
            [0.5, -0.5]                # 16 (P4)
        ]
        
        # Create channel indicators on head
        head_circles = []
        for i in range(channel_count):
            if i < len(channel_positions):
                x, y = channel_positions[i]
                # Create channel marker
                circle = patches.Circle((x, y), 0.1, color=COLORS['channels'][i], alpha=0.7)
                head_ax.add_patch(circle)
                head_circles.append(circle)
                
                # Add channel number
                head_ax.text(x, y, str(i+1), ha='center', va='center', fontsize=8, 
                          color='white', fontweight='bold')
        
        # Add any missing channels (if channel_count > defined positions)
        for i in range(len(channel_positions), channel_count):
            # Add at default position
            angle = 2 * np.pi * (i / channel_count)
            x = 0.7 * np.cos(angle)
            y = 0.7 * np.sin(angle)
            
            circle = patches.Circle((x, y), 0.1, color=COLORS['channels'][i % len(COLORS['channels'])], alpha=0.7)
            head_ax.add_patch(circle)
            head_circles.append(circle)
            
            head_ax.text(x, y, str(i+1), ha='center', va='center', fontsize=8, 
                      color='white', fontweight='bold')
        
        # Add 'R' marker for right side
        head_ax.text(0.05, 0, "R", ha='center', va='center', fontsize=10, 
                  color='white', fontweight='bold')
        
        # Create control buttons
        buttons = create_control_buttons(fig)
        
        # Set button text based on streaming state
        if stream_active:
            start_button.label.set_text('Stop Data Stream')
            start_button.color = 'salmon'
        
        # Create animation with fast updates
        ani = FuncAnimation(fig, update_plot, interval=33,  # ~30 FPS
                           blit=True, cache_frame_data=False)
        
        # Try to maximize window
        try:
            manager = plt.get_current_fig_manager()
            if hasattr(manager, 'window'):
                manager.window.state('zoomed')  # Windows
            elif hasattr(manager, 'full_screen_toggle'):
                manager.full_screen_toggle()  # Linux
            elif hasattr(manager, 'frame'):
                manager.frame.Maximize(True)  # wxPython
            else:
                # Try backend-specific approaches
                backend = matplotlib.get_backend()
                if backend == 'TkAgg':
                    manager.resize(*manager.window.maxsize())
                elif backend == 'Qt5Agg':
                    manager.window.showMaximized()
                elif backend == 'WXAgg':
                    manager.frame.Maximize(True)
        except Exception as e:
            print(f"Could not maximize window: {e}")
        
        # Show plot and start event loop
        print("Visualization window opened")
        plt.show()
        
        # When plot is closed
        running = False
        print("Visualization stopped")
    
    except Exception as e:
        print(f"Error in visualization: {e}")
        import traceback
        traceback.print_exc()
        running = False

# If script is run directly
if __name__ == "__main__":
    # Create command-line argument parser
    parser = argparse.ArgumentParser(description='OpenBCI EEG Visualization')
    parser.add_argument('--board_type', default='cyton', choices=['cyton', 'cyton_daisy'],
                        help='Board type: cyton (8 channels) or cyton_daisy (16 channels)')
    parser.add_argument('--experiment_name', default='Unnamed Experiment',
                        help='Name of the experiment for display purposes')
    parser.add_argument('--vertical_scale', type=int, default=200,
                        help='Vertical scale in microvolts (default: 200)')
    parser.add_argument('--time_window', type=float, default=5.0,
                        help='Time window to display in seconds (default: 5)')
    parser.add_argument('--max_frequency', type=int, default=60,
                        help='Maximum frequency to display in FFT plot (default: 60 Hz)')
    parser.add_argument('--max_uv_fft', type=int, default=100,
                        help='Maximum amplitude for FFT display in microvolts (default: 100)')
    parser.add_argument('--smoothing', action='store_true', default=True,
                        help='Enable signal smoothing (default: True)')
    parser.add_argument('--filtering', action='store_true', default=True,
                        help='Enable bandpass filtering (default: True)')
    parser.add_argument('--test_mode', action='store_true',
                        help='Run with simulated test data instead of reading from stdin')
    parser.add_argument('--auto_start', action='store_true', 
                        help='Automatically start data stream on launch')
    parser.add_argument('--csv_file', type=str,
                        help='Read data from a CSV file instead of stdin')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Update global settings
    VERTICAL_SCALE = args.vertical_scale
    TIME_WINDOW = args.time_window
    max_frequency = args.max_frequency
    max_uv_fft = args.max_uv_fft
    smoothing_enabled = args.smoothing
    filter_enabled = args.filtering
    stream_active = args.auto_start
    
    print("Starting Enhanced EEG Visualizer...")
    
    # Try to import scipy - add a fallback if not available
    if not SCIPY_AVAILABLE:
        print("Warning: scipy not found. Advanced signal processing will be limited.")
        def apply_bandpass(data, *args, **kwargs):
            return data
    
    # Set running flag for the visualization
    running = True
    
    # Start appropriate data source thread
    if args.csv_file:
        print(f"Using CSV file as data source: {args.csv_file}")
        csv_thread = threading.Thread(target=process_csv, args=(args.csv_file,))
        csv_thread.daemon = True
        csv_thread.start()
    elif args.test_mode:
        print("Starting in TEST MODE with simulated data")
        test_thread = threading.Thread(target=generate_test_data)
        test_thread.daemon = True
        test_thread.start()
    else:
        print("Using stdin as data source")
        data_thread = threading.Thread(target=read_data_from_stdin)
        data_thread.daemon = True
        data_thread.start()
    
    # Start visualization
    start_visualization(args.board_type, args.experiment_name)
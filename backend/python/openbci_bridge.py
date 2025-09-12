import argparse
import time
import json
import os
import sys
import numpy as np
from datetime import datetime
import traceback
import subprocess
import queue
import threading

# Add delay for initialization
time.sleep(1)

try:
    from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds, LogLevels
    
    # Enable detailed logging for debugging
    BoardShim.enable_dev_board_logger()
    BoardShim.set_log_level(LogLevels.LEVEL_DEBUG)
    
    BRAINFLOW_AVAILABLE = True
except ImportError as e:
    print(f"BrainFlow import error: {e}")
    BRAINFLOW_AVAILABLE = False

# Global variables to track board state
current_board = None
current_board_id = None
is_streaming = False

# Visualization-related globals
visualizer_process = None
data_queue = queue.Queue()
stream_running = False
data_thread = None

def init_board(serial_port):
    """Initialize connection to the OpenBCI board."""
    global current_board, current_board_id, is_streaming
    
    if not BRAINFLOW_AVAILABLE:
        return {
            'status': 'error',
            'message': 'BrainFlow library not available'
        }
    
    try:
        print(f"Attempting to connect to board on port: {serial_port}")
        
        # Wait a bit to ensure port is ready
        time.sleep(3)
        
        # Set parameters for the board
        params = BrainFlowInputParams()
        params.serial_port = serial_port
        
        # Try with Cyton + Daisy first (16 channels)
        try:
            print("Trying to connect to Cyton+Daisy board...")
            board_id = BoardIds.CYTON_DAISY_BOARD
            board = BoardShim(board_id, params)
            
            print("Preparing session...")
            board.prepare_session()
            print("Cyton+Daisy board connected successfully!")
            
            # Store current board globally
            current_board = board
            current_board_id = board_id
            is_streaming = False
            
            # Do not release session so we can keep connection
            # Just store a reference to the board
            
            return {
                'status': 'success',
                'message': 'Cyton+Daisy board connected successfully',
                'board_type': 'cyton_daisy'
            }
        except Exception as e1:
            print(f"Failed to connect to Cyton+Daisy: {e1}")
            print(traceback.format_exc())
            
            # Try with Cyton only (8 channels)
            try:
                print("Trying to connect to Cyton board...")
                board_id = BoardIds.CYTON_BOARD
                board = BoardShim(board_id, params)
                
                print("Preparing session...")
                board.prepare_session()
                print("Cyton board connected successfully!")
                
                # Store current board globally
                current_board = board
                current_board_id = board_id
                is_streaming = False
                
                # Do not release session so we can keep connection
                # Just store a reference to the board
                
                return {
                    'status': 'success',
                    'message': 'Cyton board connected successfully',
                    'board_type': 'cyton'
                }
            except Exception as e2:
                print(f"Failed to connect to Cyton: {e2}")
                print(traceback.format_exc())
                raise Exception(f"Could not connect to either board type: {e1}, {e2}")
    except Exception as e:
        print(f"Connection error: {e}")
        print(traceback.format_exc())
        return {
            'status': 'error',
            'message': str(e)
        }

def check_connection(serial_port):
    """Check if the OpenBCI board is connected."""
    global current_board, current_board_id, is_streaming
    
    if not BRAINFLOW_AVAILABLE:
        return {
            'status': 'error',
            'connected': False,
            'message': 'BrainFlow library not available'
        }
    
    try:
        # Check if we already have a board object
        if current_board is not None:
            try:
                # Try to get board data to see if it's still connected
                data_test = current_board.get_board_data(1)
                print("Current board is connected")
                
                return {
                    'status': 'success',
                    'connected': True,
                    'board_type': 'cyton_daisy' if current_board_id == BoardIds.CYTON_DAISY_BOARD else 'cyton'
                }
            except Exception as e:
                print(f"Error with existing board: {e}")
                print("Will try to reconnect")
                
                # Reset global variables
                current_board = None
                current_board_id = None
                is_streaming = False
        
        # Try Cyton + Daisy first
        try:
            print(f"Checking connection for Cyton+Daisy on port: {serial_port}")
            params = BrainFlowInputParams()
            params.serial_port = serial_port
            board_id = BoardIds.CYTON_DAISY_BOARD
            board = BoardShim(board_id, params)
            
            board.prepare_session()
            
            # Store reference
            current_board = board
            current_board_id = board_id
            is_streaming = False
            
            return {
                'status': 'success',
                'connected': True,
                'board_type': 'cyton_daisy'
            }
        except Exception as e:
            print(f"Failed to connect to Cyton+Daisy during check: {e}")
            
            # Try Cyton only
            try:
                print(f"Checking connection for Cyton on port: {serial_port}")
                params = BrainFlowInputParams()
                params.serial_port = serial_port
                board_id = BoardIds.CYTON_BOARD
                board = BoardShim(board_id, params)
                
                board.prepare_session()
                
                # Store reference
                current_board = board
                current_board_id = board_id
                is_streaming = False
                
                return {
                    'status': 'success',
                    'connected': True,
                    'board_type': 'cyton'
                }
            except Exception as e2:
                print(f"Failed to connect to Cyton during check: {e2}")
                
                # Reset global variables
                current_board = None
                current_board_id = None
                is_streaming = False
                
                return {
                    'status': 'error',
                    'connected': False,
                    'message': str(e2)
                }
    except Exception as e:
        print(f"Connection check error: {e}")
        print(traceback.format_exc())
        
        # Reset global variables
        current_board = None
        current_board_id = None
        is_streaming = False
        
        return {
            'status': 'error',
            'connected': False,
            'message': str(e)
        }

def start_recording(serial_port, experiment_name=''):
    """Start recording EEG data from the OpenBCI board."""
    global current_board, current_board_id, is_streaming
    
    if not BRAINFLOW_AVAILABLE:
        return {
            'status': 'error',
            'message': 'BrainFlow library not available'
        }
    
    try:
        # Check if we already have a board object
        if current_board is not None and not is_streaming:
            try:
                print("Using existing board connection to start streaming")
                current_board.start_stream()
                is_streaming = True
                
                # Start visualizer with experiment name
                if experiment_name:
                    start_visualizer(experiment_name)
                else:
                    start_visualizer("OpenBCI Recording")
                
                return {
                    'status': 'success',
                    'message': f"Recording started with existing board connection",
                    'timestamp': datetime.now().isoformat(),
                    'board_type': 'cyton_daisy' if current_board_id == BoardIds.CYTON_DAISY_BOARD else 'cyton'
                }
            except Exception as e:
                print(f"Error starting stream with existing board: {e}")
                print(traceback.format_exc())
                print("Will try to reconnect")
                
                # Reset global variables
                current_board = None
                current_board_id = None
                is_streaming = False
        
        # If already streaming
        if is_streaming:
            # Start visualizer with experiment name if not already started
            if experiment_name:
                start_visualizer(experiment_name)
            else:
                start_visualizer("OpenBCI Recording")
                
            return {
                'status': 'success',
                'message': 'Already recording',
                'timestamp': datetime.now().isoformat(),
                'board_type': 'cyton_daisy' if current_board_id == BoardIds.CYTON_DAISY_BOARD else 'cyton'
            }
        
        # Try to set up a new connection
        print(f"Starting recording on port: {serial_port}")
        params = BrainFlowInputParams()
        params.serial_port = serial_port
        
        # Try Cyton + Daisy first
        try:
            print("Trying to start recording with Cyton+Daisy...")
            board_id = BoardIds.CYTON_DAISY_BOARD
            board = BoardShim(board_id, params)
            
            board.prepare_session()
            board.start_stream()
            
            # Update global variables
            current_board = board
            current_board_id = board_id
            is_streaming = True
            
            # Start visualizer with experiment name
            if experiment_name:
                start_visualizer(experiment_name)
            else:
                start_visualizer("OpenBCI Recording")
            
            print("Recording started with Cyton+Daisy board!")
            return {
                'status': 'success',
                'message': 'Recording started with Cyton+Daisy board',
                'timestamp': datetime.now().isoformat(),
                'board_type': 'cyton_daisy'
            }
        except Exception as e1:
            print(f"Failed to start recording with Cyton+Daisy: {e1}")
            print(traceback.format_exc())
            # Try Cyton only
            try:
                print("Trying to start recording with Cyton...")
                board_id = BoardIds.CYTON_BOARD
                board = BoardShim(board_id, params)
                
                board.prepare_session()
                board.start_stream()
                
                # Update global variables
                current_board = board
                current_board_id = board_id
                is_streaming = True
                
                # Start visualizer with experiment name
                if experiment_name:
                    start_visualizer(experiment_name)
                else:
                    start_visualizer("OpenBCI Recording")
                
                print("Recording started with Cyton board!")
                return {
                    'status': 'success',
                    'message': 'Recording started with Cyton board',
                    'timestamp': datetime.now().isoformat(),
                    'board_type': 'cyton'
                }
            except Exception as e2:
                print(f"Failed to start recording with Cyton: {e2}")
                print(traceback.format_exc())
                raise Exception(f"Could not start recording with either board type: {e1}, {e2}")
    except Exception as e:
        print(f"Start recording error: {e}")
        print(traceback.format_exc())
        return {
            'status': 'error',
            'message': str(e)
        }

def stop_recording(serial_port, experiment_id, duration=5, output_file=None, experiment_name=''):
    """Stop recording and save the data."""
    global current_board, current_board_id, is_streaming
    
    if not BRAINFLOW_AVAILABLE:
        return {
            'status': 'error',
            'message': 'BrainFlow library not available'
        }
    
    try:
        # Check if we have a current board and it's streaming
        if current_board is not None and is_streaming:
            try:
                print("Using existing board connection to stop streaming")
                
                # Wait for data to be collected
                print(f"Waiting {duration} seconds to collect data...")
                time.sleep(duration)
                
                # Get data
                data = current_board.get_board_data()
                
                # Stop stream
                current_board.stop_stream()
                is_streaming = False
                
                # Process and save the data
                board_id = current_board_id
                
                # Stop visualizer
                stop_visualizer()
            except Exception as e:
                print(f"Error with existing board: {e}")
                print(traceback.format_exc())
                
                # Stop visualizer anyway if there was an error
                stop_visualizer()
                
                return {
                    'status': 'error',
                    'message': f"Error getting data from board: {str(e)}"
                }
        else:
            # No current board or not streaming
            print("No active streaming session to stop")
            
            # Try to establish a connection first
            params = BrainFlowInputParams()
            params.serial_port = serial_port
            
            # Try Cyton + Daisy first
            try:
                print("Trying to connect to Cyton+Daisy...")
                board_id = BoardIds.CYTON_DAISY_BOARD
                board = BoardShim(board_id, params)
                
                board.prepare_session()
                board.start_stream()
                
                # Wait for data to be collected
                print(f"Waiting {duration} seconds to collect data...")
                time.sleep(duration)
                
                # Get data
                data = board.get_board_data()
                
                # Stop stream
                board.stop_stream()
                board.release_session()
                
                # Stop visualizer if running
                stop_visualizer()
            except Exception as e1:
                print(f"Failed with Cyton+Daisy: {e1}")
                print(traceback.format_exc())
                
                # Try Cyton only
                try:
                    print("Trying to connect to Cyton...")
                    board_id = BoardIds.CYTON_BOARD
                    board = BoardShim(board_id, params)
                    
                    board.prepare_session()
                    board.start_stream()
                    
                    # Wait for data to be collected
                    print(f"Waiting {duration} seconds to collect data...")
                    time.sleep(duration)
                    
                    # Get data
                    data = board.get_board_data()
                    
                    # Stop stream
                    board.stop_stream()
                    board.release_session()
                    
                    # Stop visualizer if running
                    stop_visualizer()
                except Exception as e2:
                    print(f"Failed with Cyton: {e2}")
                    print(traceback.format_exc())
                    
                    # Stop visualizer if running anyway
                    stop_visualizer()
                    
                    raise Exception(f"Could not connect to either board type: {e1}, {e2}")
        
        # Create directory if it doesn't exist
        os.makedirs('uploads/eeg', exist_ok=True)
        
        # Generate filename with timestamp if not provided
        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f'eeg_{experiment_id}_{timestamp}.csv'
        
        file_path = os.path.join('uploads/eeg', output_file)
        
        # Save data to CSV file
        print(f"Saving data to {file_path}")
        
        # Get EEG channels
        eeg_channels = BoardShim.get_eeg_channels(board_id)
        
        # Check if data has content
        if data.size == 0 or len(data) == 0:
            print("No data was collected")
            return {
                'status': 'error',
                'message': 'No data was collected during recording'
            }
        
        eeg_data = data[eeg_channels, :]
        
        # Create CSV header
        header = 'timestamp,'
        header += ','.join([f'channel_{i+1}' for i in range(len(eeg_channels))])
        
        # Create CSV content
        csv_content = [header]
        timestamps = data[BoardShim.get_timestamp_channel(board_id)]
        
        for i in range(eeg_data.shape[1]):
            row = f"{timestamps[i]},"
            row += ','.join([str(eeg_data[j][i]) for j in range(eeg_data.shape[0])])
            csv_content.append(row)
        
        # Write to file
        with open(file_path, 'w') as f:
            f.write('\n'.join(csv_content))
        
        print(f"Data saved successfully to {file_path}")
        
        # Stop visualizer
        stop_visualizer()
        
        # Return success information
        return {
            'status': 'success',
            'message': 'Recording stopped and data saved',
            'filename': output_file,
            'file_path': file_path,
            'timestamp': datetime.now().isoformat(),
            'channels': len(eeg_channels),
            'samples': eeg_data.shape[1],
            'sampling_rate': BoardShim.get_sampling_rate(board_id),
            'board_type': 'cyton_daisy' if board_id == BoardIds.CYTON_DAISY_BOARD else 'cyton'
        }
    except Exception as e:
        print(f"Stop recording error: {e}")
        print(traceback.format_exc())
        
        # Stop visualizer if there was an error
        stop_visualizer()
        
        return {
            'status': 'error',
            'message': str(e)
        }

def disconnect(serial_port):
    """Disconnect from the OpenBCI board."""
    global current_board, current_board_id, is_streaming
    
    if not BRAINFLOW_AVAILABLE:
        return {
            'status': 'error',
            'message': 'BrainFlow library not available'
        }
    
    try:
        # Check if we have a current board
        if current_board is not None:
            try:
                print("Disconnecting existing board...")
                
                # Stop visualizer if it's running
                stop_visualizer()
                
                # Stop streaming if active
                if is_streaming:
                    current_board.stop_stream()
                
                # Release session
                current_board.release_session()
                
                # Reset global variables
                current_board = None
                current_board_id = None
                is_streaming = False
                
                return {
                    'status': 'success',
                    'message': 'Board disconnected successfully'
                }
            except Exception as e:
                print(f"Error disconnecting existing board: {e}")
                print(traceback.format_exc())
                
                # Stop visualizer if there was an error
                stop_visualizer()
                
                # Reset global variables anyway
                current_board = None
                current_board_id = None
                is_streaming = False
        
        # Try to determine which board type is connected
        print(f"Disconnecting from board on port: {serial_port}")
        params = BrainFlowInputParams()
        params.serial_port = serial_port
        
        # Try Cyton + Daisy first
        try:
            board = BoardShim(BoardIds.CYTON_DAISY_BOARD, params)
            
            # Try to stop any ongoing stream
            try:
                board.stop_stream()
            except Exception as e:
                print(f"Error stopping stream: {e}")
            
            # Release session
            try:
                board.release_session()
            except Exception as e:
                print(f"Error releasing session: {e}")
            
            # Stop visualizer if running
            stop_visualizer()
            
            return {
                'status': 'success',
                'message': 'Cyton+Daisy board disconnected'
            }
        except Exception as e1:
            print(f"Failed to disconnect from Cyton+Daisy: {e1}")
            
            # Try Cyton only
            try:
                board = BoardShim(BoardIds.CYTON_BOARD, params)
                
                # Try to stop any ongoing stream
                try:
                    board.stop_stream()
                except Exception as e:
                    print(f"Error stopping stream: {e}")
                
                # Release session
                try:
                    board.release_session()
                except Exception as e:
                    print(f"Error releasing session: {e}")
                
                # Stop visualizer if running
                stop_visualizer()
                
                return {
                    'status': 'success',
                    'message': 'Cyton board disconnected'
                }
            except Exception as e2:
                print(f"Failed to disconnect from Cyton: {e2}")
                
                # Stop visualizer if running anyway
                stop_visualizer()
                
                return {
                    'status': 'error',
                    'message': f"Could not disconnect from either board type: {e1}, {e2}"
                }
    except Exception as e:
        print(f"Disconnect error: {e}")
        print(traceback.format_exc())
        
        # Stop visualizer if running anyway
        stop_visualizer()
        
        # Reset global variables anyway
        current_board = None
        current_board_id = None
        is_streaming = False
        
        return {
            'status': 'error',
            'message': str(e)
        }

def stream_data_to_visualizer():
    """Thread function to stream data to the visualizer process"""
    global stream_running, current_board, current_board_id
    
    print("Data streaming thread started")
    
    # Get sampling rate and channel list
    if current_board_id is not None:
        sampling_rate = BoardShim.get_sampling_rate(current_board_id)
        eeg_channels = BoardShim.get_eeg_channels(current_board_id)
    else:
        print("Error: No board connected")
        return
    
    # Calculate sleep time based on sampling rate 
    # (smaller for higher sampling rates)
    sleep_time = 1.0 / (sampling_rate / 10)  # Process data in small batches
    
    # Keep track of last processed data point
    last_idx = 0
    
    while stream_running and current_board is not None:
        try:
            # Sleep to match approximate sampling rate
            time.sleep(sleep_time)
            
            # Get latest data if streaming
            if is_streaming:
                # Get only new data since last read
                data = current_board.get_board_data()
                
                # Check if we have new data
                if data.shape[1] > last_idx:
                    # Extract EEG channels
                    eeg_data = data[eeg_channels, last_idx:]
                    
                    # Update last index
                    last_idx = data.shape[1]
                    
                    # For each new sample
                    for i in range(eeg_data.shape[1]):
                        # Extract single sample across all channels
                        sample = [float(eeg_data[j][i]) for j in range(eeg_data.shape[0])]
                        
                        # Send sample to visualizer stdin
                        if visualizer_process and visualizer_process.stdin:
                            try:
                                json_data = json.dumps(sample) + '\n'
                                visualizer_process.stdin.write(json_data)
                                visualizer_process.stdin.flush()
                            except:
                                pass
        except Exception as e:
            print(f"Error in streaming thread: {e}")
            print(traceback.format_exc())
            time.sleep(0.1)  # Prevent tight loop if error
    
    print("Data streaming thread stopped")

def start_visualizer(experiment_name=''):
    """Start the visualizer process"""
    global visualizer_process, stream_running, data_thread, current_board_id
    
    # Check if already running
    if visualizer_process is not None:
        print("Visualizer already running")
        return
    
    try:
        # Get path to visualizer script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        visualizer_path = os.path.join(script_dir, "brainwave_visualizer.py")
        
        # Check if visualizer script exists
        if not os.path.exists(visualizer_path):
            print(f"Visualizer script not found at {visualizer_path}")
            # Create a minimal script if it doesn't exist
            with open(visualizer_path, 'w') as f:
                f.write("""
import sys
import json
print("Minimal visualizer started - please run pip install matplotlib to enable full visualization")
while True:
    try:
        line = sys.stdin.readline()
        if not line:
            break
        # Just print data received
        print(f"Received: {line.strip()}")
    except:
        break
""")
        
        # Determine board type
        board_type = 'cyton_daisy' if current_board_id == BoardIds.CYTON_DAISY_BOARD else 'cyton'
        
        # Build command
        cmd = [
            sys.executable,
            visualizer_path,
            '--board_type', board_type,
            '--experiment_name', experiment_name or 'OpenBCI Recording'
        ]
        
        # Start visualizer in a separate process
        print(f"Starting visualizer: {' '.join(cmd)}")
        visualizer_process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            text=True,
            # Don't capture stdout/stderr to avoid blocking
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Start data streaming thread
        stream_running = True
        data_thread = threading.Thread(target=stream_data_to_visualizer)
        data_thread.daemon = True
        data_thread.start()
        
        print(f"Visualizer started successfully for {board_type}")
        
    except Exception as e:
        print(f"Error starting visualizer: {e}")
        print(traceback.format_exc())

def stop_visualizer():
    """Stop the visualizer process"""
    global visualizer_process, stream_running, data_thread
    
    # Stop streaming thread
    stream_running = False
    
    # Wait for thread to finish
    if data_thread and data_thread.is_alive():
        try:
            data_thread.join(timeout=2)
        except:
            pass
    
    # Terminate visualizer process
    if visualizer_process is not None:
        try:
            # Close stdin pipe
            if visualizer_process.stdin:
                visualizer_process.stdin.close()
            
            # Wait briefly for process to exit
            visualizer_process.wait(timeout=2)
        except:
            # Force terminate if still running
            try:
                visualizer_process.terminate()
                visualizer_process.wait(timeout=2)
            except:
                try:
                    visualizer_process.kill()
                except:
                    pass
        finally:
            visualizer_process = None
            print("Visualizer stopped")

if __name__ == '__main__':
    # Add more detailed logging
    print(f"Python version: {sys.version}")
    print(f"Script executing from: {os.path.abspath(__file__)}")
    print(f"Current working directory: {os.getcwd()}")
    
    if BRAINFLOW_AVAILABLE:
        print("BrainFlow library is available")
    else:
        print("BrainFlow library is NOT available - functionality will be limited")
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--action', type=str, required=True, 
                        help='Action to perform: connect, check_connection, start_recording, stop_recording, disconnect')
    parser.add_argument('--serial_port', type=str, required=True, 
                        help='Serial port for OpenBCI board (e.g., COM3, /dev/ttyUSB0)')
    parser.add_argument('--experiment_id', type=str, required=False, default='test',
                        help='Experiment ID for saving data')
    parser.add_argument('--duration', type=int, required=False, default=5,
                        help='Duration to record in seconds')
    parser.add_argument('--output_file', type=str, required=False,
                        help='Output filename for saving data')
    parser.add_argument('--experiment_name', type=str, required=False, default='',
                        help='Experiment name for visualization')
    
    args = parser.parse_args()
    
    print(f"Executing action: {args.action} on port: {args.serial_port}")
    
    try:
        if args.action == 'connect':
            result = init_board(args.serial_port)
        elif args.action == 'check_connection':
            result = check_connection(args.serial_port)
        elif args.action == 'start_recording':
            result = start_recording(args.serial_port, args.experiment_name)
        elif args.action == 'stop_recording':
            result = stop_recording(args.serial_port, args.experiment_id, args.duration, args.output_file, args.experiment_name)
        elif args.action == 'disconnect':
            result = disconnect(args.serial_port)
        else:
            result = {'status': 'error', 'message': f'Unknown action: {args.action}'}
    except Exception as e:
        print(f"Error executing action: {e}")
        print(traceback.format_exc())
        result = {'status': 'error', 'message': str(e)}
    
    # Output JSON result for Node.js to parse
    print(json.dumps(result))
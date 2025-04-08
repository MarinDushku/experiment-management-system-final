import argparse
import time
import json
import os
import sys
import numpy as np
from datetime import datetime
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds, LogLevels

def init_board(serial_port):
    """Initialize connection to the OpenBCI board."""
    try:
        # Enable logging
        BoardShim.enable_dev_board_logger()
        
        # Set parameters for the board
        params = BrainFlowInputParams()
        params.serial_port = serial_port
        
        # Create board instance (Cyton + Daisy = 16 channels)
        board = BoardShim(BoardIds.CYTON_DAISY_BOARD, params)
        
        # Prepare session
        board.prepare_session()
        
        return {
            'status': 'success',
            'message': 'Board connected successfully'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def check_connection(serial_port):
    """Check if the OpenBCI board is connected."""
    try:
        # Set parameters for the board
        params = BrainFlowInputParams()
        params.serial_port = serial_port
        
        # Create board instance (Cyton + Daisy = 16 channels)
        board = BoardShim(BoardIds.CYTON_DAISY_BOARD, params)
        
        # Try to prepare session (will throw an error if not connected)
        board.prepare_session()
        
        # Release session
        board.release_session()
        
        return {
            'status': 'success',
            'connected': True
        }
    except Exception as e:
        return {
            'status': 'error',
            'connected': False,
            'message': str(e)
        }

def start_recording(serial_port):
    """Start recording EEG data from the OpenBCI board."""
    try:
        # Set parameters for the board
        params = BrainFlowInputParams()
        params.serial_port = serial_port
        
        # Create board instance (Cyton + Daisy = 16 channels)
        board = BoardShim(BoardIds.CYTON_DAISY_BOARD, params)
        
        # Prepare session
        board.prepare_session()
        
        # Start stream
        board.start_stream()
        
        return {
            'status': 'success',
            'message': 'Recording started',
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def stop_recording(serial_port, experiment_id, duration=5):
    """Stop recording and save the data."""
    try:
        # Set parameters for the board
        params = BrainFlowInputParams()
        params.serial_port = serial_port
        
        # Create board instance (Cyton + Daisy = 16 channels)
        board = BoardShim(BoardIds.CYTON_DAISY_BOARD, params)
        
        # Wait for data to be collected
        time.sleep(duration)
        
        # Get data (assuming board is already streaming)
        data = board.get_board_data()
        
        # Stop stream
        board.stop_stream()
        
        # Release session
        board.release_session()
        
        # Create directory if it doesn't exist
        os.makedirs('uploads/eeg', exist_ok=True)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'uploads/eeg/eeg_{experiment_id}_{timestamp}.npy'
        
        # Save data to file
        np.save(filename, data)
        
        # Convert data to JSON-serializable format
        eeg_channels = BoardShim.get_eeg_channels(BoardIds.CYTON_DAISY_BOARD)
        eeg_data = data[eeg_channels, :].tolist()
        
        return {
            'status': 'success',
            'message': 'Recording stopped and data saved',
            'filename': filename,
            'timestamp': datetime.now().isoformat(),
            'channels': len(eeg_channels),
            'samples': len(eeg_data[0]) if eeg_data and len(eeg_data) > 0 else 0,
            'sampling_rate': BoardShim.get_sampling_rate(BoardIds.CYTON_DAISY_BOARD)
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def disconnect(serial_port):
    """Disconnect from the OpenBCI board."""
    try:
        # Set parameters for the board
        params = BrainFlowInputParams()
        params.serial_port = serial_port
        
        # Create board instance (Cyton + Daisy = 16 channels)
        board = BoardShim(BoardIds.CYTON_DAISY_BOARD, params)
        
        # Try to stop any ongoing stream
        try:
            board.stop_stream()
        except:
            pass
        
        # Release session
        try:
            board.release_session()
        except:
            pass
        
        return {
            'status': 'success',
            'message': 'Board disconnected'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--action', type=str, required=True, 
                        help='Action to perform: connect, check_connection, start_recording, stop_recording, disconnect')
    parser.add_argument('--serial_port', type=str, required=True, 
                        help='Serial port for OpenBCI board (e.g., COM3, /dev/ttyUSB0)')
    parser.add_argument('--experiment_id', type=str, required=False, 
                        help='Experiment ID for saving data')
    parser.add_argument('--duration', type=int, required=False, default=5,
                        help='Duration to record in seconds')
    
    args = parser.parse_args()
    
    if args.action == 'connect':
        result = init_board(args.serial_port)
    elif args.action == 'check_connection':
        result = check_connection(args.serial_port)
    elif args.action == 'start_recording':
        result = start_recording(args.serial_port)
    elif args.action == 'stop_recording':
        if not args.experiment_id:
            result = {'status': 'error', 'message': 'experiment_id is required for stop_recording'}
        else:
            result = stop_recording(args.serial_port, args.experiment_id, args.duration)
    elif args.action == 'disconnect':
        result = disconnect(args.serial_port)
    else:
        result = {'status': 'error', 'message': f'Unknown action: {args.action}'}
    
    # Output JSON result for Node.js to parse
    print(json.dumps(result))
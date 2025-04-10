import argparse
import time
import json
import os
import sys
import numpy as np
from datetime import datetime
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds, LogLevels

# Enable detailed logging for debugging
BoardShim.enable_dev_board_logger()
BoardShim.set_log_level(LogLevels.LEVEL_DEBUG)

def init_board(serial_port):
    """Initialize connection to the OpenBCI board."""
    try:
        print(f"Attempting to connect to board on port: {serial_port}")
        
        # Set parameters for the board
        params = BrainFlowInputParams()
        params.serial_port = serial_port
        
        # Try with Cyton + Daisy first (16 channels)
        try:
            print("Trying to connect to Cyton+Daisy board...")
            board = BoardShim(BoardIds.CYTON_DAISY_BOARD, params)
            board.prepare_session()
            print("Cyton+Daisy board connected successfully!")
            board.release_session()  # Release to avoid conflicts with later operations
            return {
                'status': 'success',
                'message': 'Cyton+Daisy board connected successfully',
                'board_type': 'cyton_daisy'
            }
        except Exception as e1:
            print(f"Failed to connect to Cyton+Daisy: {e1}")
            
            # Try with Cyton only (8 channels)
            try:
                print("Trying to connect to Cyton board...")
                board = BoardShim(BoardIds.CYTON_BOARD, params)
                board.prepare_session()
                print("Cyton board connected successfully!")
                board.release_session()  # Release to avoid conflicts with later operations
                return {
                    'status': 'success',
                    'message': 'Cyton board connected successfully',
                    'board_type': 'cyton'
                }
            except Exception as e2:
                print(f"Failed to connect to Cyton: {e2}")
                raise Exception(f"Could not connect to either board type: {e1}, {e2}")
    except Exception as e:
        print(f"Connection error: {e}")
        return {
            'status': 'error',
            'message': str(e)
        }

def check_connection(serial_port):
    """Check if the OpenBCI board is connected."""
    try:
        # Try Cyton + Daisy first
        try:
            print(f"Checking connection for Cyton+Daisy on port: {serial_port}")
            params = BrainFlowInputParams()
            params.serial_port = serial_port
            board = BoardShim(BoardIds.CYTON_DAISY_BOARD, params)
            board.prepare_session()
            board.release_session()
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
                board = BoardShim(BoardIds.CYTON_BOARD, params)
                board.prepare_session()
                board.release_session()
                return {
                    'status': 'success',
                    'connected': True,
                    'board_type': 'cyton'
                }
            except Exception as e2:
                print(f"Failed to connect to Cyton during check: {e2}")
                return {
                    'status': 'error',
                    'connected': False,
                    'message': str(e2)
                }
    except Exception as e:
        print(f"Connection check error: {e}")
        return {
            'status': 'error',
            'connected': False,
            'message': str(e)
        }

def start_recording(serial_port):
    """Start recording EEG data from the OpenBCI board."""
    try:
        board = None
        board_id = None
        
        # Try to determine which board type is connected
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
            print("Recording started with Cyton+Daisy board!")
            return {
                'status': 'success',
                'message': 'Recording started with Cyton+Daisy board',
                'timestamp': datetime.now().isoformat(),
                'board_type': 'cyton_daisy'
            }
        except Exception as e1:
            print(f"Failed to start recording with Cyton+Daisy: {e1}")
            
            # Try Cyton only
            try:
                print("Trying to start recording with Cyton...")
                board_id = BoardIds.CYTON_BOARD
                board = BoardShim(board_id, params)
                board.prepare_session()
                board.start_stream()
                print("Recording started with Cyton board!")
                return {
                    'status': 'success',
                    'message': 'Recording started with Cyton board',
                    'timestamp': datetime.now().isoformat(),
                    'board_type': 'cyton'
                }
            except Exception as e2:
                print(f"Failed to start recording with Cyton: {e2}")
                raise Exception(f"Could not start recording with either board type: {e1}, {e2}")
    except Exception as e:
        print(f"Start recording error: {e}")
        return {
            'status': 'error',
            'message': str(e)
        }

def stop_recording(serial_port, experiment_id, duration=5, output_file=None):
    """Stop recording and save the data."""
    try:
        board = None
        board_id = None
        
        # Try to determine which board type is connected
        print(f"Stopping recording on port: {serial_port}")
        params = BrainFlowInputParams()
        params.serial_port = serial_port
        
        # Try Cyton + Daisy first
        try:
            print("Trying to stop recording with Cyton+Daisy...")
            board_id = BoardIds.CYTON_DAISY_BOARD
            board = BoardShim(board_id, params)
            # We're assuming the board is already streaming, so we don't call prepare_session
            
            # Wait for data to be collected
            print(f"Waiting {duration} seconds to collect data...")
            time.sleep(duration)
            
            # Get data (assuming board is already streaming)
            data = board.get_board_data()
            
            # Stop stream
            board.stop_stream()
            board.release_session()
            
        except Exception as e1:
            print(f"Failed to stop recording with Cyton+Daisy: {e1}")
            
            # Try Cyton only
            try:
                print("Trying to stop recording with Cyton...")
                board_id = BoardIds.CYTON_BOARD
                board = BoardShim(board_id, params)
                
                # Wait for data to be collected
                print(f"Waiting {duration} seconds to collect data...")
                time.sleep(duration)
                
                # Get data (assuming board is already streaming)
                data = board.get_board_data()
                
                # Stop stream
                board.stop_stream()
                board.release_session()
                
            except Exception as e2:
                print(f"Failed to stop recording with Cyton: {e2}")
                raise Exception(f"Could not stop recording with either board type: {e1}, {e2}")
        
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
        return {
            'status': 'error',
            'message': str(e)
        }

def disconnect(serial_port):
    """Disconnect from the OpenBCI board."""
    try:
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
            except:
                pass
            
            # Release session
            try:
                board.release_session()
            except:
                pass
            
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
                except:
                    pass
                
                # Release session
                try:
                    board.release_session()
                except:
                    pass
                
                return {
                    'status': 'success',
                    'message': 'Cyton board disconnected'
                }
            except Exception as e2:
                print(f"Failed to disconnect from Cyton: {e2}")
                return {
                    'status': 'error',
                    'message': f"Could not disconnect from either board type: {e1}, {e2}"
                }
    except Exception as e:
        print(f"Disconnect error: {e}")
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
    parser.add_argument('--experiment_id', type=str, required=False, default='test',
                        help='Experiment ID for saving data')
    parser.add_argument('--duration', type=int, required=False, default=5,
                        help='Duration to record in seconds')
    parser.add_argument('--output_file', type=str, required=False,
                        help='Output filename for saving data')
    
    args = parser.parse_args()
    
    if args.action == 'connect':
        result = init_board(args.serial_port)
    elif args.action == 'check_connection':
        result = check_connection(args.serial_port)
    elif args.action == 'start_recording':
        result = start_recording(args.serial_port)
    elif args.action == 'stop_recording':
        result = stop_recording(args.serial_port, args.experiment_id, args.duration, args.output_file)
    elif args.action == 'disconnect':
        result = disconnect(args.serial_port)
    else:
        result = {'status': 'error', 'message': f'Unknown action: {args.action}'}
    
    # Output JSON result for Node.js to parse
    print(json.dumps(result))
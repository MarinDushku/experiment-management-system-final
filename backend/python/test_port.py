import time
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds, LogLevels

# Enable verbose logging
BoardShim.enable_dev_board_logger()
BoardShim.set_log_level(LogLevels.LEVEL_DEBUG)

def test_connection(port='COM3'):
    print(f"Testing OpenBCI connection on {port}")
    print("Initializing...")
    
    # Give the board time to initialize
    time.sleep(3)
    
    params = BrainFlowInputParams()
    params.serial_port = port
    
    try:
        print("Attempting to connect to Cyton+Daisy board...")
        board = BoardShim(BoardIds.CYTON_DAISY_BOARD, params)
        
        print("Preparing session...")
        board.prepare_session()
        print("Session prepared successfully!")
        
        print("Board connected!")
        board.release_session()
        
        print("Test completed successfully!")
        return True
    except Exception as e:
        print(f"Error during test: {e}")
        return False

if __name__ == "__main__":
    test_connection('COM3')
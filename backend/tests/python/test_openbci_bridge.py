"""
Comprehensive tests for OpenBCI bridge functionality.
"""
import pytest
import sys
import os
import json
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Add the python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'python'))

# Mock brainflow before importing
sys.modules['brainflow'] = Mock()
sys.modules['brainflow.board_shim'] = Mock()

# Import the module under test
import openbci_bridge

class TestOpenBCIBridge:
    """Test suite for OpenBCI bridge functionality."""
    
    def setup_method(self):
        """Setup for each test method."""
        # Reset global variables
        openbci_bridge.current_board = None
        openbci_bridge.current_board_id = None
        openbci_bridge.is_streaming = False
        openbci_bridge.visualizer_process = None
        openbci_bridge.stream_running = False
        openbci_bridge.data_thread = None
        
        # Clear the data queue
        while not openbci_bridge.data_queue.empty():
            try:
                openbci_bridge.data_queue.get_nowait()
            except:
                break
    
    def test_brainflow_not_available(self):
        """Test behavior when BrainFlow is not available."""
        # Mock BrainFlow as unavailable
        openbci_bridge.BRAINFLOW_AVAILABLE = False
        
        result = openbci_bridge.init_board('COM3')
        
        assert result['status'] == 'error'
        assert 'BrainFlow library not available' in result['message']
    
    @patch('openbci_bridge.BoardShim')
    @patch('openbci_bridge.BrainFlowInputParams')
    def test_init_board_success(self, mock_params, mock_board_shim):
        """Test successful board initialization."""
        openbci_bridge.BRAINFLOW_AVAILABLE = True
        
        # Mock BrainFlow components
        mock_board_instance = Mock()
        mock_board_shim.return_value = mock_board_instance
        mock_params_instance = Mock()
        mock_params.return_value = mock_params_instance
        
        # Mock successful board preparation
        mock_board_instance.prepare_session.return_value = None
        
        with patch('openbci_bridge.BoardIds') as mock_board_ids:
            mock_board_ids.CYTON_BOARD = 0
            
            result = openbci_bridge.init_board('COM3')
            
            assert result['status'] == 'success'
            assert openbci_bridge.current_board == mock_board_instance
            assert openbci_bridge.current_board_id == 0
    
    @patch('openbci_bridge.BoardShim')
    @patch('openbci_bridge.BrainFlowInputParams')
    def test_init_board_failure(self, mock_params, mock_board_shim):
        """Test board initialization failure."""
        openbci_bridge.BRAINFLOW_AVAILABLE = True
        
        # Mock BrainFlow components
        mock_board_instance = Mock()
        mock_board_shim.return_value = mock_board_instance
        mock_params_instance = Mock()
        mock_params.return_value = mock_params_instance
        
        # Mock board preparation failure
        mock_board_instance.prepare_session.side_effect = Exception("Connection failed")
        
        with patch('openbci_bridge.BoardIds') as mock_board_ids:
            mock_board_ids.CYTON_BOARD = 0
            
            result = openbci_bridge.init_board('COM3')
            
            assert result['status'] == 'error'
            assert 'Connection failed' in result['message']
    
    def test_start_stream_no_board(self):
        """Test starting stream without initialized board."""
        openbci_bridge.current_board = None
        
        result = openbci_bridge.start_stream('test_experiment')
        
        assert result['status'] == 'error'
        assert 'No board connected' in result['message']
    
    @patch('openbci_bridge.threading.Thread')
    def test_start_stream_success(self, mock_thread):
        """Test successful stream start."""
        # Mock board
        mock_board = Mock()
        openbci_bridge.current_board = mock_board
        openbci_bridge.current_board_id = 0
        
        # Mock thread
        mock_thread_instance = Mock()
        mock_thread.return_value = mock_thread_instance
        
        result = openbci_bridge.start_stream('test_experiment')
        
        assert result['status'] == 'success'
        assert openbci_bridge.is_streaming == True
        mock_board.start_stream.assert_called_once()
        mock_thread_instance.start.assert_called_once()
    
    def test_start_stream_already_streaming(self):
        """Test starting stream when already streaming."""
        mock_board = Mock()
        openbci_bridge.current_board = mock_board
        openbci_bridge.is_streaming = True
        
        result = openbci_bridge.start_stream('test_experiment')
        
        assert result['status'] == 'error'
        assert 'Stream already running' in result['message']
    
    def test_stop_stream_no_board(self):
        """Test stopping stream without initialized board."""
        openbci_bridge.current_board = None
        
        result = openbci_bridge.stop_stream()
        
        assert result['status'] == 'error'
        assert 'No board connected' in result['message']
    
    def test_stop_stream_not_streaming(self):
        """Test stopping stream when not streaming."""
        mock_board = Mock()
        openbci_bridge.current_board = mock_board
        openbci_bridge.is_streaming = False
        
        result = openbci_bridge.stop_stream()
        
        assert result['status'] == 'error'
        assert 'Stream not running' in result['message']
    
    @patch('openbci_bridge.save_eeg_data')
    def test_stop_stream_success(self, mock_save_data):
        """Test successful stream stop."""
        mock_board = Mock()
        openbci_bridge.current_board = mock_board
        openbci_bridge.is_streaming = True
        openbci_bridge.stream_running = True
        
        # Mock data thread
        mock_thread = Mock()
        openbci_bridge.data_thread = mock_thread
        
        # Mock data saving
        mock_save_data.return_value = {'status': 'success', 'file_path': 'test.csv'}
        
        result = openbci_bridge.stop_stream()
        
        assert result['status'] == 'success'
        assert openbci_bridge.is_streaming == False
        assert openbci_bridge.stream_running == False
        mock_board.stop_stream.assert_called_once()
        mock_thread.join.assert_called_once()
    
    @patch('openbci_bridge.np.savetxt')
    @patch('openbci_bridge.os.makedirs')
    def test_save_eeg_data_success(self, mock_makedirs, mock_savetxt):
        """Test successful EEG data saving."""
        # Create test data
        test_data = np.array([[1, 2, 3], [4, 5, 6]])
        
        # Put test data in queue
        openbci_bridge.data_queue.put(test_data)
        openbci_bridge.data_queue.put(test_data)
        
        experiment_name = 'test_experiment'
        
        result = openbci_bridge.save_eeg_data(experiment_name)
        
        assert result['status'] == 'success'
        assert experiment_name in result['file_path']
        assert result['sample_count'] == 6  # 2 arrays * 3 samples each
        
        # Verify file operations
        mock_makedirs.assert_called_once()
        mock_savetxt.assert_called_once()
    
    def test_save_eeg_data_no_data(self):
        """Test saving EEG data when no data is available."""
        experiment_name = 'test_experiment'
        
        result = openbci_bridge.save_eeg_data(experiment_name)
        
        assert result['status'] == 'error'
        assert 'No data to save' in result['message']
    
    @patch('openbci_bridge.np.savetxt')
    @patch('openbci_bridge.os.makedirs')
    def test_save_eeg_data_file_error(self, mock_makedirs, mock_savetxt):
        """Test EEG data saving with file write error."""
        # Put test data in queue
        test_data = np.array([[1, 2, 3]])
        openbci_bridge.data_queue.put(test_data)
        
        # Mock file write error
        mock_savetxt.side_effect = IOError("Permission denied")
        
        experiment_name = 'test_experiment'
        
        result = openbci_bridge.save_eeg_data(experiment_name)
        
        assert result['status'] == 'error'
        assert 'Permission denied' in result['message']
    
    def test_get_board_info_no_board(self):
        """Test getting board info without initialized board."""
        openbci_bridge.current_board = None
        
        result = openbci_bridge.get_board_info()
        
        assert result['status'] == 'error'
        assert 'No board connected' in result['message']
    
    @patch('openbci_bridge.BoardShim.get_sampling_rate')
    @patch('openbci_bridge.BoardShim.get_eeg_channels')
    def test_get_board_info_success(self, mock_get_channels, mock_get_sampling_rate):
        """Test successful board info retrieval."""
        mock_board = Mock()
        openbci_bridge.current_board = mock_board
        openbci_bridge.current_board_id = 0
        
        # Mock board info
        mock_get_sampling_rate.return_value = 250
        mock_get_channels.return_value = [1, 2, 3, 4, 5, 6, 7, 8]
        
        result = openbci_bridge.get_board_info()
        
        assert result['status'] == 'success'
        assert result['board_id'] == 0
        assert result['sampling_rate'] == 250
        assert result['channel_count'] == 8
        assert result['is_streaming'] == False
    
    def test_disconnect_board_no_board(self):
        """Test disconnecting when no board is connected."""
        openbci_bridge.current_board = None
        
        result = openbci_bridge.disconnect_board()
        
        assert result['status'] == 'success'
        assert 'No board was connected' in result['message']
    
    def test_disconnect_board_while_streaming(self):
        """Test disconnecting board while streaming."""
        mock_board = Mock()
        openbci_bridge.current_board = mock_board
        openbci_bridge.is_streaming = True
        
        result = openbci_bridge.disconnect_board()
        
        assert result['status'] == 'error'
        assert 'Stop the stream before disconnecting' in result['message']
    
    def test_disconnect_board_success(self):
        """Test successful board disconnection."""
        mock_board = Mock()
        openbci_bridge.current_board = mock_board
        openbci_bridge.current_board_id = 0
        openbci_bridge.is_streaming = False
        
        result = openbci_bridge.disconnect_board()
        
        assert result['status'] == 'success'
        assert openbci_bridge.current_board is None
        assert openbci_bridge.current_board_id is None
        mock_board.release_session.assert_called_once()
    
    def test_disconnect_board_release_error(self):
        """Test board disconnection with release error."""
        mock_board = Mock()
        mock_board.release_session.side_effect = Exception("Release failed")
        openbci_bridge.current_board = mock_board
        openbci_bridge.is_streaming = False
        
        result = openbci_bridge.disconnect_board()
        
        # Should still succeed even if release fails
        assert result['status'] == 'success'
        assert openbci_bridge.current_board is None
    
    @patch('openbci_bridge.time.sleep')
    def test_data_collection_thread(self, mock_sleep):
        """Test the data collection thread functionality."""
        mock_board = Mock()
        openbci_bridge.current_board = mock_board
        openbci_bridge.current_board_id = 0
        openbci_bridge.stream_running = True
        
        # Mock board data
        test_data = np.array([[1, 2, 3, 4, 5, 6, 7, 8, 100, 200]])
        mock_board.get_board_data.return_value = test_data
        
        # Create a function that will stop the loop after one iteration
        def stop_streaming(*args):
            openbci_bridge.stream_running = False
        
        mock_sleep.side_effect = stop_streaming
        
        # Run the data collection
        openbci_bridge.collect_data()
        
        # Verify data was collected
        assert not openbci_bridge.data_queue.empty()
        collected_data = openbci_bridge.data_queue.get()
        np.testing.assert_array_equal(collected_data, test_data)
    
    def test_data_collection_thread_exception(self):
        """Test data collection thread with exception."""
        mock_board = Mock()
        mock_board.get_board_data.side_effect = Exception("Data collection failed")
        openbci_bridge.current_board = mock_board
        openbci_bridge.stream_running = True
        
        # This should not crash the thread
        with patch('openbci_bridge.time.sleep'):
            openbci_bridge.collect_data()
        
        # Stream should be stopped due to error
        assert openbci_bridge.stream_running == False
    
    @patch('openbci_bridge.subprocess.Popen')
    def test_start_visualization_success(self, mock_popen):
        """Test successful visualization start."""
        mock_process = Mock()
        mock_popen.return_value = mock_process
        
        result = openbci_bridge.start_visualization()
        
        assert result['status'] == 'success'
        assert openbci_bridge.visualizer_process == mock_process
    
    @patch('openbci_bridge.subprocess.Popen')
    def test_start_visualization_failure(self, mock_popen):
        """Test visualization start failure."""
        mock_popen.side_effect = Exception("Failed to start visualizer")
        
        result = openbci_bridge.start_visualization()
        
        assert result['status'] == 'error'
        assert 'Failed to start visualizer' in result['message']
    
    def test_stop_visualization_no_process(self):
        """Test stopping visualization when no process is running."""
        openbci_bridge.visualizer_process = None
        
        result = openbci_bridge.stop_visualization()
        
        assert result['status'] == 'success'
        assert 'No visualizer running' in result['message']
    
    def test_stop_visualization_success(self):
        """Test successful visualization stop."""
        mock_process = Mock()
        mock_process.poll.return_value = None  # Process is running
        openbci_bridge.visualizer_process = mock_process
        
        result = openbci_bridge.stop_visualization()
        
        assert result['status'] == 'success'
        assert openbci_bridge.visualizer_process is None
        mock_process.terminate.assert_called_once()
    
    def test_status_check(self):
        """Test status check functionality."""
        # Test with no board
        openbci_bridge.current_board = None
        result = openbci_bridge.get_status()
        
        assert result['connected'] == False
        assert result['streaming'] == False
        
        # Test with board connected
        mock_board = Mock()
        openbci_bridge.current_board = mock_board
        openbci_bridge.current_board_id = 0
        openbci_bridge.is_streaming = True
        
        result = openbci_bridge.get_status()
        
        assert result['connected'] == True
        assert result['streaming'] == True
        assert result['board_id'] == 0


class TestOpenBCIBridgeIntegration:
    """Integration tests for OpenBCI bridge."""
    
    @pytest.mark.integration
    def test_full_workflow_simulation(self):
        """Test a complete workflow simulation without hardware."""
        openbci_bridge.BRAINFLOW_AVAILABLE = True
        
        with patch('openbci_bridge.BoardShim') as mock_board_shim, \
             patch('openbci_bridge.BrainFlowInputParams') as mock_params, \
             patch('openbci_bridge.BoardIds') as mock_board_ids:
            
            # Setup mocks
            mock_board_instance = Mock()
            mock_board_shim.return_value = mock_board_instance
            mock_params.return_value = Mock()
            mock_board_ids.CYTON_BOARD = 0
            
            # 1. Initialize board
            result = openbci_bridge.init_board('COM3')
            assert result['status'] == 'success'
            
            # 2. Get board info
            with patch('openbci_bridge.BoardShim.get_sampling_rate', return_value=250), \
                 patch('openbci_bridge.BoardShim.get_eeg_channels', return_value=[1,2,3,4,5,6,7,8]):
                
                info = openbci_bridge.get_board_info()
                assert info['status'] == 'success'
                assert info['sampling_rate'] == 250
            
            # 3. Start stream
            with patch('openbci_bridge.threading.Thread') as mock_thread:
                mock_thread.return_value = Mock()
                stream_result = openbci_bridge.start_stream('test_experiment')
                assert stream_result['status'] == 'success'
            
            # 4. Stop stream
            with patch('openbci_bridge.save_eeg_data') as mock_save:
                mock_save.return_value = {'status': 'success', 'file_path': 'test.csv'}
                openbci_bridge.data_thread = Mock()
                
                stop_result = openbci_bridge.stop_stream()
                assert stop_result['status'] == 'success'
            
            # 5. Disconnect
            disconnect_result = openbci_bridge.disconnect_board()
            assert disconnect_result['status'] == 'success'
    
    @pytest.mark.integration
    def test_error_recovery(self):
        """Test system recovery from various error conditions."""
        openbci_bridge.BRAINFLOW_AVAILABLE = True
        
        # Test recovery from connection failure
        with patch('openbci_bridge.BoardShim') as mock_board_shim:
            mock_board_instance = Mock()
            mock_board_instance.prepare_session.side_effect = Exception("Connection lost")
            mock_board_shim.return_value = mock_board_instance
            
            with patch('openbci_bridge.BrainFlowInputParams'), \
                 patch('openbci_bridge.BoardIds') as mock_board_ids:
                mock_board_ids.CYTON_BOARD = 0
                
                result = openbci_bridge.init_board('COM3')
                assert result['status'] == 'error'
                
                # System should be in clean state
                assert openbci_bridge.current_board is None
                assert openbci_bridge.is_streaming == False
    
    @pytest.mark.slow
    def test_data_queue_performance(self):
        """Test data queue performance under load."""
        import time
        
        # Fill queue with test data
        test_data = np.random.rand(8, 1000)  # 8 channels, 1000 samples
        
        start_time = time.time()
        for _ in range(100):
            openbci_bridge.data_queue.put(test_data)
        
        # Measure queue operations
        queue_time = time.time() - start_time
        assert queue_time < 1.0  # Should complete within 1 second
        
        # Verify queue size
        assert openbci_bridge.data_queue.qsize() == 100
        
        # Clear queue
        while not openbci_bridge.data_queue.empty():
            openbci_bridge.data_queue.get()


@pytest.mark.hardware
class TestOpenBCIBridgeHardware:
    """Hardware-dependent tests (require actual OpenBCI device)."""
    
    @pytest.mark.skip(reason="Requires actual hardware")
    def test_real_hardware_connection(self):
        """Test connection to real OpenBCI hardware."""
        # This test would require actual hardware
        # and should be run in a hardware testing environment
        pass
    
    @pytest.mark.skip(reason="Requires actual hardware")
    def test_real_data_acquisition(self):
        """Test real data acquisition from hardware."""
        # This test would require actual hardware
        pass


if __name__ == '__main__':
    pytest.main([__file__])
// ExperimentResults.js - Place in frontend/src/components/admin/
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './ExperimentResults.css';

const ExperimentResults = () => {
  const [experiments, setExperiments] = useState([]);
  const [responses, setResponses] = useState([]);
  const [eegRecordings, setEegRecordings] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState({ id: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        const res = await api.get('/experiments');
        setExperiments(res.data);
      } catch (err) {
        setError('Failed to load experiments');
        console.error('Error fetching experiments:', err);
      }
    };

    fetchExperiments();
  }, []);

  const fetchExperimentData = async (experimentId, experimentName) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch responses
      const responsesRes = await api.get(`/responses?experimentId=${experimentId}`);
      setResponses(responsesRes.data.data || []);

      // Fetch EEG recordings
      const eegRes = await api.get(`/openbci/recordings?experimentId=${experimentId}`);
      setEegRecordings(eegRes.data.data || []);

      setLoading(false);
    } catch (err) {
      setError(`Failed to load data for experiment "${experimentName}"`);
      console.error('Error fetching experiment data:', err);
      setLoading(false);
    }
  };

  const handleExperimentSelect = (e) => {
    const experimentId = e.target.value;
    
    if (experimentId) {
      const selectedExp = experiments.find(exp => exp._id === experimentId);
      if (selectedExp) {
        setSelectedExperiment({
          id: selectedExp._id,
          name: selectedExp.name
        });
        fetchExperimentData(selectedExp._id, selectedExp.name);
      }
    } else {
      setSelectedExperiment({ id: '', name: '' });
      setResponses([]);
      setEegRecordings([]);
    }
  };

  const downloadResponses = () => {
    if (responses.length === 0) return;
    
    const csvContent = [
      // CSV header
      ['Experiment Name', 'Step ID', 'Response', 'Timestamp', 'Trial Index', 'Step Index', 'Time Since Start (ms)'].join(','),
      // CSV data rows
      ...responses.map(r => [
        r.experimentName || selectedExperiment.name,
        r.stepId,
        `"${r.response.replace(/"/g, '""')}"`, // Handle quotes in responses
        new Date(r.timestamp).toISOString(),
        r.trialIndex || '',
        r.stepIndex || '',
        r.timeSinceStart || ''
      ].join(','))
    ].join('\n');
    
    downloadFile(csvContent, `responses_${selectedExperiment.name}.csv`, 'text/csv');
  };

  const downloadEEGMetadata = () => {
    if (eegRecordings.length === 0) return;
    
    const csvContent = [
      // CSV header
      ['Experiment Name', 'Start Time', 'End Time', 'Sampling Rate', 'Channel Count', 'Sample Count', 'File Path'].join(','),
      // CSV data rows
      ...eegRecordings.map(r => [
        r.experimentName || selectedExperiment.name,
        new Date(r.startTime).toISOString(),
        new Date(r.endTime).toISOString(),
        r.samplingRate,
        r.channelCount,
        r.sampleCount,
        r.filePath
      ].join(','))
    ].join('\n');
    
    downloadFile(csvContent, `eeg_metadata_${selectedExperiment.name}.csv`, 'text/csv');
  };

  const downloadCombinedData = () => {
    if (responses.length === 0 && eegRecordings.length === 0) return;
    
    // Create a combined data structure
    const combinedData = {
      experimentId: selectedExperiment.id,
      experimentName: selectedExperiment.name,
      responses: responses,
      eegRecordings: eegRecordings
    };
    
    // Convert to JSON and download
    const jsonContent = JSON.stringify(combinedData, null, 2);
    downloadFile(jsonContent, `combined_data_${selectedExperiment.name}.json`, 'application/json');
  };

  const downloadFile = (content, fileName, contentType) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  };

  return (
    <div className="experiment-results">
      <h3>Experiment Results</h3>
      
      <div className="filter-container">
        <label htmlFor="experiment-select">Select Experiment:</label>
        <select 
          id="experiment-select" 
          value={selectedExperiment.id} 
          onChange={handleExperimentSelect}
        >
          <option value="">-- Select Experiment --</option>
          {experiments.map(exp => (
            <option key={exp._id} value={exp._id}>{exp.name}</option>
          ))}
        </select>
      </div>
      
      {loading && <div className="loading">Loading data...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {selectedExperiment.id && !loading && (
        <div className="results-container">
          <div className="results-header">
            <h4>Data for Experiment: {selectedExperiment.name}</h4>
            <div className="action-buttons">
              <button 
                className="btn-primary" 
                onClick={downloadResponses} 
                disabled={responses.length === 0}
              >
                Download Responses
              </button>
              <button 
                className="btn-primary" 
                onClick={downloadEEGMetadata} 
                disabled={eegRecordings.length === 0}
              >
                Download EEG Metadata
              </button>
              <button 
                className="btn-primary" 
                onClick={downloadCombinedData} 
                disabled={responses.length === 0 && eegRecordings.length === 0}
              >
                Download Combined Data
              </button>
            </div>
          </div>
          
          <div className="data-display">
            <div className="responses-container">
              <h5>Responses ({responses.length})</h5>
              {responses.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Response</th>
                      <th>Time Since Start</th>
                      <th>Trial/Step</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((r, index) => (
                      <tr key={index}>
                        <td>{r.response}</td>
                        <td>{r.timeSinceStart ? `${(r.timeSinceStart / 1000).toFixed(2)}s` : 'N/A'}</td>
                        <td>Trial {r.trialIndex !== undefined ? r.trialIndex + 1 : 'N/A'}, Step {r.stepIndex !== undefined ? r.stepIndex + 1 : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No responses found for this experiment</p>
              )}
            </div>
            
            <div className="eeg-container">
              <h5>EEG Recordings ({eegRecordings.length})</h5>
              {eegRecordings.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Start Time</th>
                      <th>Duration</th>
                      <th>File Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eegRecordings.map((r, index) => {
                      const start = new Date(r.startTime);
                      const end = new Date(r.endTime);
                      const durationMs = end - start;
                      const durationSec = (durationMs / 1000).toFixed(2);
                      
                      return (
                        <tr key={index}>
                          <td>{start.toLocaleString()}</td>
                          <td>{durationSec}s</td>
                          <td>{r.filePath}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No EEG recordings found for this experiment</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentResults;
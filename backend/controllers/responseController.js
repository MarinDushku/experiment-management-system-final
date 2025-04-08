// backend/controllers/responseController.js

const Response = require('../models/Response');

// Create a new response
exports.createResponse = async (req, res) => {
  try {
    console.log('Received response data:', req.body);
    
    const { 
      experimentId, 
      experimentName, 
      stepId, 
      response, 
      timestamp, 
      timeSinceStart,
      trialIndex,
      stepIndex
    } = req.body;
    
    // Validate required fields
    if (!experimentId || !experimentName || !stepId || !response || !timestamp) {
      console.log('Missing required fields:', { 
        experimentId, experimentName, stepId, response, timestamp 
      });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Create new response
    const newResponse = new Response({
      experimentId,
      experimentName,
      stepId,
      response,
      timestamp: new Date(timestamp),
      timeSinceStart,
      trialIndex,
      stepIndex
    });
    
    console.log('Saving response to database:', newResponse);
    
    await newResponse.save();
    console.log('Response saved successfully');
    
    return res.status(201).json({ success: true, data: newResponse });
  } catch (error) {
    console.error('Error creating response:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get responses for an experiment
exports.getResponsesByExperiment = async (req, res) => {
  try {
    const { experimentId, experimentName } = req.query;
    
    let query = {};
    
    if (experimentId) {
      query.experimentId = experimentId;
    }
    
    if (experimentName) {
      query.experimentName = experimentName;
    }
    
    // If neither is provided, return error
    if (Object.keys(query).length === 0) {
      return res.status(400).json({ success: false, message: 'Must provide experimentId or experimentName' });
    }
    
    const responses = await Response.find(query).sort({ timestamp: 1 });
    
    return res.status(200).json({ success: true, data: responses });
  } catch (error) {
    console.error('Error getting responses:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
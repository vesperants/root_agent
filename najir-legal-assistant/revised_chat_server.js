// revised_chat_server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

// Import existing server code and extend it
const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const GOOGLE_PROJECT = process.env.GOOGLE_PROJECT;
const LOCATION = process.env.LOCATION;
const DATASTORE_ID = process.env.DATASTORE_ID;
const ADK_ENDPOINT = process.env.ADK_ENDPOINT || 'http://localhost:8080'; // Your ADK agent endpoint

// Existing search endpoint from your server.js
const SEARCH_ENDPOINT = `https://${LOCATION}-discoveryengine.googleapis.com/v1/projects/${GOOGLE_PROJECT}/locations/${LOCATION}/dataStores/${DATASTORE_ID}/servingConfigs/default_config:search`;

// Implement search endpoint (keeping your existing code)
app.post('/search', async (req, res) => {
  const { query, pageToken } = req.body;
  
  // Log request input and configuration
  console.log('\n==== INCOMING SEARCH REQUEST ====');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Query:', query);
  console.log('Project:', GOOGLE_PROJECT);
  console.log('Location:', LOCATION);
  console.log('DataStore:', DATASTORE_ID);
  console.log('Endpoint:', SEARCH_ENDPOINT);
  
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });
  
  try {
    const client = await auth.getClient();
    console.log('Getting Google Cloud access token...');
    const tokenObj = await client.getAccessToken();
    const token = tokenObj.token || tokenObj;
    console.log('Access Token received:', token ? '[REDACTED]' : 'No token');
    
    const requestBody = {
      query,
      pageSize: 10,
      ...(pageToken ? { pageToken } : {}),
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Make API call
    const response = await axios.post(
      SEARCH_ENDPOINT,
      requestBody,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    // Log response status and data
    console.log('--- VERTEX AI SEARCH RESPONSE ---');
    console.log('Status:', response.status);
    console.dir(response.data, { depth: null, colors: true });
    
    res.status(200).json(response.data);
  } catch (err) {
    // Log error explicitly
    console.error('--- ERROR FROM GOOGLE API ---');
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response headers:', JSON.stringify(err.response.headers, null, 2));
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
      res.status(500).json({
        error: err.response.data?.error?.message || err.message || String(err),
        googleError: err.response.data,
      });
    } else {
      console.error(err);
      res.status(500).json({ error: err.message, raw: String(err) });
    }
  }
});

// New endpoint for chat with the ADK agent
app.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  
  console.log('\n==== INCOMING CHAT REQUEST ====');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Message:', message);
  console.log('History length:', history.length);
  
  try {
    // First, check if this is a search-related query
    const isSearchQuery = detectSearchQuery(message);
    
    if (isSearchQuery) {
      // For search queries, we don't need to call the ADK agent
      // The frontend will handle the search separately
      console.log('Detected search query - responding with search intent');
      
      // Extract search term
      const searchTerm = extractSearchTerm(message);
      
      return res.status(200).json({
        response: `Sure! Here are the results for ${searchTerm}. You can click on the link to visit the website. You can also ask me questions about specific najirs by mentioning their case numbers.`,
        metadata: {
          type: 'search',
          searchTerm
        }
      });
    }
    
    // For actual case analysis or general questions, call the ADK agent
    // For development/testing, check if ADK agent is reachable
    const isAgentAvailable = await checkAgentAvailability();
    
    if (!isAgentAvailable) {
      console.log('ADK agent unavailable - returning mock response');
      // Mock response for development/testing
      return res.status(200).json({
        response: generateMockResponse(message, history)
      });
    }
    
    // Real implementation - call ADK agent
    const agentResponse = await callAdkAgent(message, history);
    console.log('--- ADK AGENT RESPONSE ---');
    console.log(agentResponse);
    
    res.status(200).json({
      response: agentResponse
    });
  } catch (err) {
    console.error('--- ERROR FROM ADK AGENT ---');
    console.error(err);
    
    // Provide a fallback response
    res.status(200).json({
      response: "I'm sorry, I encountered an error processing your request. Please try again or rephrase your question."
    });
  }
});

// Helper function to detect search queries
function detectSearchQuery(message) {
  const searchTerms = [
    'search', 'find', 'look for', 'related to', 'about', 
    'cases of', 'cases by', 'cases concerning', 'cases involving'
  ];
  
  return searchTerms.some(term => message.toLowerCase().includes(term));
}

// Helper function to extract search terms
function extractSearchTerm(message) {
  // Check for quoted terms first
  const quoteMatch = message.match(/['"]([^'"]+)['"]/);
  if (quoteMatch) return quoteMatch[1];
  
  // Otherwise extract terms after common phrases
  const commonPhrases = [
    'search for', 'find', 'look for', 'related to', 
    'about', 'concerning', 'involving', 'cases of', 'cases by'
  ];
  
  for (const phrase of commonPhrases) {
    if (message.toLowerCase().includes(phrase)) {
      const parts = message.toLowerCase().split(phrase);
      if (parts.length > 1) {
        return parts[1].trim();
      }
    }
  }
  
  // Default fallback
  return message;
}

// Check if ADK agent is available
async function checkAgentAvailability() {
  try {
    await axios.get(`${ADK_ENDPOINT}/health`, { timeout: 1000 });
    return true;
  } catch (err) {
    console.log('ADK agent health check failed:', err.message);
    return false;
  }
}

// Call the ADK agent (actual implementation depends on your ADK setup)
async function callAdkAgent(message, history) {
  try {
    // Format conversation history as expected by your ADK agent
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the current message
    formattedHistory.push({
      role: 'user',
      content: message
    });
    
    // Call the ADK agent
    const response = await axios.post(`${ADK_ENDPOINT}/generate`, {
      messages: formattedHistory
    }, {
      timeout: 30000 // 30 second timeout
    });
    
    return response.data.content || "I didn't receive a proper response from the agent.";
  } catch (err) {
    console.error('Error calling ADK agent:', err);
    throw err;
  }
}

// Generate mock responses for testing - detect case number queries
function generateMockResponse(message, history) {
  // Check for case number pattern
  const caseNumberMatch = message.match(/(\d+[-\s]?[A-Za-z]+[-\s]?\d+)|([०१२३४५६७८९]+[-\s]?[A-Za-z]+[-\s]?[०१२३४५६७८९]+)|(\d{4,5})|([०१२३४५६७८९]{4,5})/);
  
  if (caseNumberMatch) {
    const caseNumber = caseNumberMatch[0];
    return `Case ${caseNumber} appears to be a writ petition related to property rights. Based on the title information, this case involves a dispute over land ownership between multiple parties. The petitioner is seeking relief under Articles 46 and 133 of the Constitution of Nepal. 

Without access to the full decision, I can only provide limited information based on the case title and basic details. The case was heard by a division bench and appears to involve constitutional questions about property rights. If you would like more specific information about this case, please let me know what aspects you're most interested in.`;
  }
  
  // General legal information
  if (message.toLowerCase().includes('mandamus') || message.toLowerCase().includes('writ')) {
    return "In Nepali legal context, a mandamus (परमादेश) is a type of writ that orders a government official, public authority, or lower court to properly perform their official duties. It's one of the five prerogative writs available under Nepali constitutional law, along with habeas corpus, certiorari, prohibition, and quo warranto.";
  }
  
  if (message.toLowerCase().includes('constitution') || message.toLowerCase().includes('article')) {
    return "The Constitution of Nepal, promulgated in 2015 (2072 BS), is the fundamental law of Nepal. It established Nepal as a federal democratic republic with three tiers of government: federal, provincial, and local. Articles 46 and 133 are frequently cited in Supreme Court cases, with Article 133 specifically granting extraordinary jurisdiction to the Supreme Court to issue various writs including mandamus, certiorari, prohibition, and quo warranto.";
  }
  
  // Default response for other queries
  return `I understand you're asking about "${message}". To give you specific information about Nepali Supreme Court cases, I'd need a case number. You can also search for cases related to specific topics or people. How else can I assist you with legal information?`;
}

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('\n==== Najir Legal Assistant API STARTED ====');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Listening on port:', PORT);
  console.log('Project:', GOOGLE_PROJECT);
  console.log('Location:', LOCATION);
  console.log('DataStore ID:', DATASTORE_ID);
  console.log('Search Endpoint:', SEARCH_ENDPOINT);
  console.log('ADK Agent Endpoint:', ADK_ENDPOINT);
});

module.exports = app; // For testing purposes
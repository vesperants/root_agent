 # Najir Legal Assistant System Integration Guide

This document explains how the entire Najir Legal Assistant system functions, with special focus on the intended chatflow and how the components integrate with each other.

## System Components

The Najir Legal Assistant system consists of these key components:

1. **Frontend Chat Widget** (`final_najir_widget.jsx`)
   - Provides the user interface for chat and search results
   - Manages the conversation flow and display

2. **Server** (`revised_chat_server.js`)
   - Handles API endpoints for search and chat
   - Routes requests to appropriate backend services
   - Communicates with Google Discovery Engine

3. **Root Agent** (`revised_root_agent.py`)
   - Coordinates the team of specialized agents
   - Routes different query types to appropriate agents
   - Provides the main entry point for the ADK agent system

4. **Najir Expert Agent** (`revised_najir_expert_agent.py`)
   - Specializes in analyzing specific case information
   - Provides insightful responses about case details

5. **Title Finder Tools** (`enhanced_title_finder.py`)
   - Retrieves case information from the Discovery Engine
   - Handles numeral conversions and data processing

## Detailed Chatflow

The system is designed to support the following precise chatflow:

### Phase 1: Initial Greeting

1. When a user first opens the application, they see a greeting message:
"Hello there! I can help you with searching through existing laws, Najirs, and analyze Najirs based on your needs. Let me know if you need help!"


2. This greeting is handled directly by the frontend component, not by the agent system.

### Phase 2: Case Search

1. The user types a search query, for example:
"I want to search through Najirs related to 'Sagar Thapa'"

2. The frontend detects this as a search query based on keywords like "search," "related to," or presence of quotes.

3. The frontend sends the message to be displayed in the chat interface and simultaneously:
- Makes a call to the `/search` endpoint with the extracted search term
- Displays a loading indicator

4. The server processes the search request:
- Connects to Google Discovery Engine via the search endpoint
- Retrieves matching case results
- Returns the results to the frontend

5. The frontend displays:
- The assistant's acknowledgment message: "Sure! Here are the results for Sagar Thapa. You can click on the link to visit the website. You can also ask me questions about specific najirs by mentioning their case numbers."
- The search results widget showing all matching cases
- The count of results (e.g., "showing 1-10 of 919 results")

6. The search results remain visible while the user can continue typing in the chat.

### Phase 3: Case Analysis

1. The user asks about a specific case from the results:
"Give me a short summary of case number 10523"

Or they can click directly on a case in the search results, which generates this message automatically.

2. The frontend detects this as a case-specific query based on the presence of case numbers or explicit mentions of "case."

3. The frontend:
- Adds the user's message to the chat
- Hides the search results widget
- Sends the query to the `/chat` endpoint
- Displays a loading indicator

4. The server processes the chat request:
- Recognizes this as a case-specific query
- Forwards it to the ADK agent system

5. The root agent:
- Identifies the case number in the query using the case extractor agent
- Routes the query to the Najir expert agent

6. The Najir expert agent:
- Retrieves case details using the case details tool
- Formulates a response based on available information
- Returns the analysis to the root agent

7. The response flows back through the system:
- Root agent → Server → Frontend → Chat display

8. The user sees a detailed response about the case, which includes:
- Information derived from the case title
- Basic case details (type, parties, date, etc.)
- Limitations of what can be determined from available information
- Suggestions for further specific questions

### Phase 4: Further Interaction

1. The user can continue the conversation by:
- Asking more specific questions about the same case
- Initiating a new search for different cases
- Asking general legal questions

2. The system routes each query appropriately:
- Search queries trigger the search flow (Phase 2)
- Case-specific queries go to the expert agent
- General legal questions go to the general info agent

## Component Responsibilities

### Frontend Chat Widget

- Manages the entire conversation UI
- Detects query types (search vs. case-specific)
- Handles the display of search results
- Formats and shows chat messages
- Provides intuitive result navigation

### Server

- Provides two main endpoints:
- `/search` - For retrieving case lists
- `/chat` - For agent-powered responses
- Handles authentication and error management
- Provides fallback responses during development

### Root Agent

- Routes different query types to specialized agents
- Coordinates the team-based approach
- Ensures appropriate agent handling based on query content

### Najir Expert Agent

- Specializes in analyzing specific cases
- Uses case information to provide detailed insights
- Transparently communicates knowledge limitations

### Title Finder Tools

- Connects to Discovery Engine
- Retrieves and processes case information
- Handles numeral system conversions

## Development and Testing

During development and testing, the system includes fallbacks:

1. If the ADK agent is unavailable, the server provides mock responses
2. If search fails, the frontend displays sample results
3. The launcher script provides color-coded logging for easy debugging

## Deployment

For production deployment:

1. Ensure all components are properly configured
2. Set up environment variables for Google Cloud services
3. Use the launcher script to start all components
4. Monitor logs for any issues

The system is designed to gracefully handle failures at any level and provide appropriate feedback to users.
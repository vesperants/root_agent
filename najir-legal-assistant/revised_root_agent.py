# revised_root_agent.py
from google.adk.agents import RootAgent, LlmAgent
from google.adk.agents.team import Team
from revised_najir_expert_agent import najir_expert_agent
from enhanced_title_finder import title_finder_tool, case_details_tool, case_number_converter
from vertexai.preview.language_models import TextGenerationModel

# Define constants
MODEL = "gemini-2.0-flash"
PROJECT_ID = "vesp-a581d"
LOCATION_ID = "global"
ENGINE_ID = "najir-search_1745733029866"

# Create a search coordinator agent
search_coordinator_agent = LlmAgent(
    name="search_coordinator_agent",
    model=MODEL,
    instruction=(
        "You are a search coordinator for Nepali legal cases. "
        "Your job is to understand search requests and format them properly for the search system. "
        "When users ask to find cases related to someone or something, you should extract the "
        "key search terms and format them for the Discovery Engine search. "
        "Do NOT try to answer questions about specific cases - those should be routed to the expert agent."
    ),
    description="Coordinates search queries for the Nepali legal database.",
    tools=[],
)

# Create a general information agent
general_info_agent = LlmAgent(
    name="general_info_agent",
    model=MODEL,
    instruction=(
        "You are a general information assistant for Nepali legal matters. "
        "You answer general questions about Nepali law, court procedures, and legal terms. "
        "If a question is about a specific case, defer to the Najir Expert Agent."
    ),
    description="Provides general information about Nepali legal system and concepts.",
    tools=[],
)

# Create a case number extraction agent
case_extractor_agent = LlmAgent(
    name="case_extractor_agent",
    model=MODEL,
    instruction=(
        "You are specialized in identifying case numbers in user queries. "
        "Extract any case numbers mentioned in the query. "
        "Nepali case numbers are typically in the format of numbers, possibly written in Devanagari script (०१२३४५६७८९). "
        "Return the case numbers in both Devanagari and Arabic numerals."
    ),
    description="Extracts case numbers from user queries.",
    tools=[case_number_converter],
)

# Create the team
najir_team = Team(
    name="najir_legal_team",
    agents=[
        najir_expert_agent,
        search_coordinator_agent,
        general_info_agent,
        case_extractor_agent
    ],
)

# Create the root agent
najir_root_agent = RootAgent(
    name="najir_root_agent",
    model=MODEL,
    team=najir_team,
    instruction=(
        "You are NajirBot, a specialized Nepali legal assistant. "
        "You help users find information about Nepali Supreme Court cases. "
        
        "WORKFLOW:\n"
        "1. When a user asks to search for cases related to a topic or person, do NOT try to answer directly.\n"
        "   Instead, route to the search_coordinator_agent to format the search query properly.\n"
        "   The search results will be displayed by the frontend widget automatically.\n"
        
        "2. When a user asks about a specific case number (after seeing search results),\n"
        "   first use case_extractor_agent to extract and validate the case number,\n"
        "   then route to najir_expert_agent to provide the case analysis.\n"
        
        "3. For general legal questions not related to specific cases or searches,\n"
        "   route to general_info_agent.\n"
        
        "KEY BEHAVIORS:\n"
        "- Never try to provide search results directly in your response - that's handled by the UI.\n"
        "- Always acknowledge when you're passing a query to the search system.\n"
        "- For case-specific queries, make it clear you're consulting the expert system.\n"
        "- Always respond in the same language as the user's query (English or Nepali).\n"
        "- Format all case numbers appropriately in both Arabic and Devanagari numerals as needed.\n"
        "- The initial greeting about capabilities should be provided by the frontend, not by you.\n"
    ),
    description="Root agent for the Najir Legal Assistant system.",
)

def handle_user_message(message, conversation_history=None):
    """
    Main entry point for processing user messages.
    
    Args:
        message: The user's message text
        conversation_history: List of previous messages (optional)
        
    Returns:
        Dict with response and metadata for the frontend
    """
    if conversation_history is None:
        conversation_history = []
    
    # Check if this is a search query
    is_search_query = any(term in message.lower() for term in [
        "search", "find", "look for", "related to", "about", "cases of", 
        "cases by", "cases concerning", "cases involving"
    ])
    
    # Check if this is a case-specific query
    has_case_number = bool(
        message.lower().replace("case", "").replace("number", "").strip().replace(" ", "")
        .replace("-", "").replace("।", "").replace(".", "")
        .replace("?", "").replace("!", "")
        .translate(str.maketrans("", "", "०१२३४५६७८९0123456789"))
        != message.lower().replace("case", "").replace("number", "").strip()
    )
    
    # Handle different query types
    if is_search_query:
        # Extract search terms
        search_term = message
        if "'" in message or '"' in message:
            import re
            match = re.search(r'[\'"]([^\'"]+)[\'"]', message)
            if match:
                search_term = match.group(1)
        
        # Format response for search
        response = f"I'll search for cases related to {search_term}."
        
        # Return with metadata for the frontend
        return {
            "response": response,
            "metadata": {
                "type": "search",
                "search_term": search_term
            }
        }
    
    elif has_case_number:
        # For case-specific queries, use the expert agent
        try:
            response = najir_expert_agent.generate_content(message)
            return {
                "response": response.text,
                "metadata": {
                    "type": "case_analysis"
                }
            }
        except Exception as e:
            print(f"Error using expert agent: {e}")
            return {
                "response": "I encountered an error while analyzing this case. Please try again.",
                "metadata": {
                    "type": "error"
                }
            }
    
    else:
        # For general queries, use the root agent
        try:
            response = najir_root_agent.generate_content(message)
            return {
                "response": response.text,
                "metadata": {
                    "type": "general"
                }
            }
        except Exception as e:
            print(f"Error using root agent: {e}")
            return {
                "response": "I'm having trouble processing your request. Could you rephrase your question?",
                "metadata": {
                    "type": "error"
                }
            }

# For direct usage through the ADK server
def process_message(query):
    try:
        result = handle_user_message(query)
        return result["response"]
    except Exception as e:
        print(f"Error processing message: {e}")
        return "I encountered an error while processing your request. Please try again."

print(f"✅ Revised najir_root_agent loaded with team of {len(najir_team.agents)} agents.")
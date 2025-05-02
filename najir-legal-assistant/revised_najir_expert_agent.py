 # revised_najir_expert_agent.py
from google.adk.agents import LlmAgent
from enhanced_title_finder import title_finder_tool, case_details_tool, case_number_converter
from vertexai.preview.language_models import TextGenerationModel

# Define constants
MODEL = "gemini-2.0-flash"
PROJECT_ID = "vesp-a581d"
LOCATION_ID = "global"
ENGINE_ID = "najir-search_1745733029866"

def najir_analysis_tool(
    case_number: str,
    user_question: str,
) -> str:
    """
    Analyzes a case based on the title and generates an answer to the user's question.
    
    Args:
        case_number: The case number to analyze
        user_question: The user's question about this case
        
    Returns:
        An answer to the user's question based on available case information
    """
    # Step 1: Retrieve the case details
    case_details = case_details_tool(case_number)
    
    if not case_details or "title" not in case_details:
        return f"Sorry, case {case_number} not found."
    
    # Step 2: Use LLM to answer based on the case details
    prompt = (
        f"You are a Nepali legal expert. Information about Supreme Court decision {case_number}:\n\n"
        f"Title: {case_details.get('title', 'N/A')}\n"
        f"Case Type: {case_details.get('case_type', 'N/A')}\n"
        f"Date: {case_details.get('date', 'N/A')}\n"
        f"Bench: {case_details.get('bench', 'N/A')}\n"
        f"Petitioner: {case_details.get('petitioner', 'N/A')}\n"
        f"Respondent: {case_details.get('respondent', 'N/A')}\n\n"
        f"Using ONLY the information above, answer the following question:\n"
        f"{user_question}\n\n"
        f"If the information provided is not sufficient to answer the question, "
        f"explain what is known from the available data and clearly state what additional "
        f"information would be needed to fully answer the question."
    )
    
    try:
        model = TextGenerationModel.from_pretrained(MODEL)
        response = model.predict(prompt)
        return response.text.strip()
    except Exception as e:
        print("LLM error:", e)
        return "Sorry, an internal error occurred while analyzing the case."

# Create the revised Najir expert agent
najir_expert_agent = LlmAgent(
    name="najir_expert_agent",
    model=MODEL,
    instruction=(
        "You are the Najir Expert, a specialized assistant for Nepali Supreme Court cases. "
        "Your primary purpose is to answer questions about specific cases, using ONLY "
        "the information that can be retrieved from the case database. "
        
        "IMPORTANT GUIDELINES:\n"
        "1. Always be transparent about the limitations of your knowledge.\n"
        "2. Only use information that is actually retrieved from the database.\n"
        "3. If asked about details not found in the title or basic case information, "
           "acknowledge the limitations and suggest how the user might find more information.\n"
        "4. Be respectful of Nepali legal traditions and use proper terminology.\n"
        "5. Respond in the same language as the user's query (English or Nepali).\n"
        "6. Format case numbers correctly in both Arabic and Devanagari script as appropriate."
    ),
    description="Legal expert providing case analysis based on available information.",
    tools=[title_finder_tool, case_details_tool, case_number_converter, najir_analysis_tool],
)

print(f"✅ revised_najir_expert_agent loaded.")
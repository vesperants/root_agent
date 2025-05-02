 # enhanced_title_finder.py
from typing import Optional, Dict, Any
from google.api_core.client_options import ClientOptions
from google.cloud import discoveryengine_v1
from google.adk.tool import tool

# Constants
PROJECT_ID = "vesp-a581d"
LOCATION_ID = "global"
ENGINE_ID = "najir-search_1745733029866"

def arabic_to_devanagari(numstr: str) -> str:
    """Convert Arabic numerals to Devanagari numerals."""
    digits_map = str.maketrans("0123456789", "०१२३४५६७८९")
    return numstr.translate(digits_map)

def devanagari_to_arabic(numstr: str) -> str:
    """Convert Devanagari numerals to Arabic numerals."""
    digits_map = str.maketrans("०१२३४५६७८९", "0123456789")
    return numstr.translate(digits_map)

def normalize_case_number(case_number: str) -> tuple:
    """Normalize a case number to both Arabic and Devanagari formats."""
    # Check if the number contains Devanagari digits
    if any(char in "०१२३४५६७८९" for char in case_number):
        dev_number = case_number
        arabic_number = devanagari_to_arabic(case_number)
    else:
        arabic_number = case_number
        dev_number = arabic_to_devanagari(case_number)
    
    return arabic_number, dev_number

def retrieve_case_title(
    case_number: str,
    project_id: str = PROJECT_ID,
    location: str = LOCATION_ID,
    engine_id: str = ENGINE_ID
) -> Optional[Dict[str, Any]]:
    """
    Retrieve case information based on case number.
    Returns a dictionary with case details or None if not found.
    """
    # Normalize case number
    arabic_number, nepali_number = normalize_case_number(case_number)
    
    # Set up client
    api_endpoint = f"{location}-discoveryengine.googleapis.com" if location != "global" else None
    client_options = ClientOptions(api_endpoint=api_endpoint) if api_endpoint else None
    client = discoveryengine_v1.SearchServiceClient(client_options=client_options)
    
    # Define serving config
    serving_config = (
        f"projects/{project_id}/locations/{location}/collections/default_collection/"
        f"engines/{engine_id}/servingConfigs/default_config"
    )
    
    # Create search request
    # Try with both formats for better matching
    for query_number in [nepali_number, arabic_number]:
        request = discoveryengine_v1.SearchRequest(
            serving_config=serving_config,
            query=query_number,
            page_size=5,
        )
        
        try:
            response = client.search(request)
            
            # Process results
            for resp in response:
                if hasattr(resp, 'document') and hasattr(resp.document, 'struct_data'):
                    data = resp.document.struct_data
                    decision_no = data.get("decision_no", "")
                    
                    # Check if this is the correct case
                    if decision_no in [nepali_number, arabic_number]:
                        return {
                            "title": data.get("title", ""),
                            "decision_no": decision_no,
                            "date": data.get("date", ""),
                            "bench": data.get("bench", ""),
                            "petitioner": data.get("petitioner", ""),
                            "respondent": data.get("respondent", ""),
                            "case_type": data.get("case_type", ""),
                        }
        except Exception as e:
            print(f"Error searching with {query_number}: {e}")
    
    return None

@tool
def title_finder_tool(case_number: str) -> str:
    """
    ADK tool that retrieves the title of a Supreme Court case by case number.
    
    Args:
        case_number: The case number in either Arabic or Devanagari format
        
    Returns:
        The title of the case or an empty string if not found
    """
    case_info = retrieve_case_title(case_number)
    if not case_info:
        return ""
    return case_info.get("title", "")

@tool
def case_details_tool(case_number: str) -> Dict[str, Any]:
    """
    ADK tool that retrieves basic details about a case by its number.
    
    Args:
        case_number: The case number in either Arabic or Devanagari format
        
    Returns:
        A dictionary with case details or an empty dict if not found
    """
    case_info = retrieve_case_title(case_number)
    if not case_info:
        return {}
    return case_info

@tool
def case_number_converter(case_number: str, target_format: str = "both") -> Dict[str, str]:
    """
    ADK tool that converts between Arabic and Devanagari numerals.
    
    Args:
        case_number: The case number to convert
        target_format: The desired format ("arabic", "devanagari", or "both")
        
    Returns:
        A dictionary with the converted number(s)
    """
    arabic, devanagari = normalize_case_number(case_number)
    
    if target_format.lower() == "arabic":
        return {"arabic": arabic}
    elif target_format.lower() == "devanagari":
        return {"devanagari": devanagari}
    else:  # Default to both
        return {
            "arabic": arabic,
            "devanagari": devanagari
        }

print(f"✅ Enhanced title finder tools loaded.")
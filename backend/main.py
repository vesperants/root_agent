"""
main.py
Entry point for the modular ADK agent system.
This script imports the root agent and allows interactive user input with real LLM/agent logic.
"""

import os
import asyncio
from agents.root_agent import root_agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types  # For Content/Part
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

# --- Load environment variables from .env file ---
load_dotenv()

# --- Setup ADK Runner and Session Service ---
APP_NAME = "my_adk_app"  # You can change this as needed
USER_ID = "test_user"    # For demo/testing
SESSION_ID = "test_session"  # For demo/testing

# Create session service and runner
session_service = InMemorySessionService()
runner = Runner(
    agent=root_agent,
    app_name=APP_NAME,
    session_service=session_service
)

def ensure_session():
    """
    Ensure the session exists before sending a message.
    This avoids session errors and keeps usage simple.
    """
    if not session_service.get_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID):
        session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)

# --- Async function to send user message to agent and print response ---
async def call_agent_async(query: str):
    """
    Sends a query to the agent and prints the final response from the LLM/agent.
    """
    ensure_session()
    print(f"\n>>> You: {query}")
    content = types.Content(role='user', parts=[types.Part(text=query)])
    final_response_text = "Agent did not produce a final response."
    async for event in runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=content):
        if event.is_final_response():
            if event.content and event.content.parts:
                final_response_text = event.content.parts[0].text
            elif event.actions and event.actions.escalate:
                final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
            break
    print(f"<<< Agent: {final_response_text}")

# --- Helper to get agent reply as a string (not print) ---
async def get_agent_reply(query: str) -> str:
    """
    Sends a query to the agent and returns the final response as a string.
    """
    ensure_session()
    content = types.Content(role='user', parts=[types.Part(text=query)])
    final_response_text = "Agent did not produce a final response."
    async for event in runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=content):
        if event.is_final_response():
            if event.content and event.content.parts:
                final_response_text = event.content.parts[0].text
            elif event.actions and event.actions.escalate:
                final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
            break
    return final_response_text

# --- Create FastAPI app ---
app = FastAPI()

# --- API endpoint for agent chat ---
@app.post("/api/agent")
async def agent_endpoint(request: Request):
    """
    Receives a POST request with a JSON body containing 'message'.
    Returns the agent's reply as JSON.
    """
    data = await request.json()
    message = data.get("message", "")
    if not message:
        return JSONResponse({"reply": "No message provided."}, status_code=400)
    reply = await get_agent_reply(message)
    return JSONResponse({"reply": reply})

# --- Optional: Run with Uvicorn if executed directly ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 
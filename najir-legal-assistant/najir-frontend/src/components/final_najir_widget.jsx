 // final_najir_widget.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";

export default function NajirChatWidget() {
  // Initial welcome message is already shown
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      content: "Hello there! I can help you with searching through existing laws, Najirs, and analyze Najirs based on your needs. Let me know if you need help!",
    },
  ]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, searchResults, showSearchResults]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send message to server
  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { role: "user", content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // First check if this is a search query
    const isSearchQuery = checkIfSearchQuery(message);

    if (isSearchQuery) {
      // Handle search query
      await handleSearchQuery(message);
    } else {
      // Handle regular query (case-specific or general)
      await handleRegularQuery(message);
    }

    setIsLoading(false);
  };

  // Check if message is a search query
  const checkIfSearchQuery = (message) => {
    const searchPatterns = [
      'search', 'find', 'look for', 'related to', 'about',
      'cases of', 'cases by', 'cases concerning', 'cases involving'
    ];
    
    return searchPatterns.some(pattern => 
      message.toLowerCase().includes(pattern)
    );
  };

  // Extract search term from query
  const extractSearchTerm = (message) => {
    // First try to extract quoted terms
    const quoteMatch = message.match(/['"]([^'"]+)['"]/);
    if (quoteMatch) return quoteMatch[1];
    
    // Try after common phrases
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
  };

  // Handle search query
  const handleSearchQuery = async (message) => {
    const term = extractSearchTerm(message);
    setSearchTerm(term);
    
    // Add system response about search
    const searchResponseMessage = {
      role: "assistant",
      content: `Sure! Here are the results for ${term}. You can click on the link to visit the website. You can also ask me questions about specific najirs by mentioning their case numbers.`
    };
    setChatHistory(prev => [...prev, searchResponseMessage]);
    
    // Fetch search results
    try {
      const response = await fetch("http://localhost:4000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term }),
      });
      
      const data = await response.json();
      
      // Process results
      const results = data.results || [];
      const processedResults = results.map(r => {
        if (r.document && r.document.structData) {
          return {
            id: r.document.id || Math.random().toString(),
            title: r.document.structData.title || "Untitled",
            link: r.document.structData.link || "#",
            caseNumber: r.document.structData.decision_no || "",
            date: r.document.structData.date || "",
            caseType: r.document.structData.case_type || ""
          };
        }
        return null;
      }).filter(Boolean);
      
      setSearchResults(processedResults);
      setTotalResults(data.totalSize || processedResults.length);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
      
      // Add error message
      const errorMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error while searching. Please try again or try a different search term."
      };
      setChatHistory(prev => [...prev, errorMessage]);
      
      // Set fallback results for demo purposes
      setSearchResults([
        {
          id: "1",
          title: "निषेध १, १०७२३ · उत्प्रेषण परमादेश अपराध",
          link: "https://nirg.gov.np/full_text/",
          caseNumber: "१०७२३",
          date: "२०७८-०१-१५",
          caseType: "उत्प्रेषण परमादेश"
        },
        {
          id: "2",
          title: "निषेध १, १२६७ · गपसाउने",
          link: "https://nirg.gov.np/anhivan/",
          caseNumber: "१२६७",
          date: "२०७८-०३-२१",
          caseType: "गपसाउने"
        },
        {
          id: "3",
          title: "निषेध १, ८ ६९३ - निधाना",
          link: "https://nirg.gov.ratary.nkker/",
          caseNumber: "८६९३",
          date: "२०७८-०२-०४",
          caseType: "निधाना"
        }
      ]);
      setTotalResults(3);
      setShowSearchResults(true);
    }
  };

  // Handle regular query (case-specific or general)
  const handleRegularQuery = async (message) => {
    try {
      // Hide search results when asking about specific case
      setShowSearchResults(false);
      
      // Call the chat endpoint
      const response = await fetch("http://localhost:4000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          history: chatHistory.filter(msg => msg.role !== "system")
        }),
      });
      
      const data = await response.json();
      
      // Add assistant's response to chat
      const assistantMessage = {
        role: "assistant",
        content: data.response
      };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      
      // Add error message
      const errorMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error while processing your request. Please try again."
      };
      setChatHistory(prev => [...prev, errorMessage]);
    }
  };

  // Handle result click
  const handleResultClick = (result) => {
    // When user clicks on a result, create a message asking about that case
    sendMessage(`Give me a short summary of case number ${result.caseNumber}`);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Render the component
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Chat container */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          paddingRight: "8px",
        }}
      >
        {/* Chat messages */}
        {chatHistory.map((msg, idx) => (
          <div
            key={`msg-${idx}`}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              padding: "10px 16px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              backgroundColor: msg.role === "user" ? "#e7f5ff" : "#f1f3f5",
              marginBottom: "8px",
            }}
          >
            {msg.content}
          </div>
        ))}

        {/* Search results */}
        {showSearchResults && searchResults.length > 0 && (
          <div
            style={{
              alignSelf: "flex-start",
              width: "100%",
              maxWidth: "95%",
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              border: "1px solid #e9ecef",
              marginBottom: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e9ecef",
                fontSize: "14px",
                color: "#6c757d",
              }}
            >
              showing 1-{searchResults.length} of {totalResults} results
            </div>
            {searchResults.map((result) => (
              <div
                key={result.id}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #e9ecef",
                  cursor: "pointer",
                }}
                onClick={() => handleResultClick(result)}
              >
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "4px",
                  }}
                >
                  {result.title}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6c757d",
                    marginBottom: "4px",
                  }}
                >
                  {result.date && `${result.date} · `}{result.caseType}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#0366d6",
                  }}
                >
                  {result.link}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div
            style={{
              alignSelf: "flex-start",
              padding: "10px 16px",
              borderRadius: "18px 18px 18px 4px",
              backgroundColor: "#f1f3f5",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#adb5bd",
                animation: "pulse 1s infinite",
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#adb5bd",
                animation: "pulse 1s infinite",
                animationDelay: "0.2s",
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#adb5bd",
                animation: "pulse 1s infinite",
                animationDelay: "0.4s",
              }}
            />
          </div>
        )}
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          marginTop: "16px",
          borderTop: "1px solid #e9ecef",
          paddingTop: "16px",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "24px",
            border: "1px solid #ced4da",
            outline: "none",
            fontSize: "16px",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          style={{
            marginLeft: "8px",
            padding: "10px 20px",
            backgroundColor: "#339af0",
            color: "white",
            border: "none",
            borderRadius: "24px",
            cursor: isLoading || !inputValue.trim() ? "not-allowed" : "pointer",
            opacity: isLoading || !inputValue.trim() ? 0.7 : 1,
            fontSize: "16px",
          }}
        >
          Send
        </button>
      </form>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
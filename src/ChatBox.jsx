import { useState } from "react";
import "./ChatBox.css";

function ChatBox({ works, onSelectWork, onClose }) {

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can help you explore the MPLADS data. Ask me things like 'Show high-risk projects' or 'Find completed projects with zero expenditure'."
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Stores the remaining projects popup
  const [showAllResults, setShowAllResults] = useState(null);


  // --------------------------------
  // SEND MESSAGE
  // --------------------------------

  async function sendMessage() {

    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const lowerMessage = userMessage.toLowerCase();


    // --------------------------------
    // CASUAL RESPONSES
    // --------------------------------

    const casualResponses = {
      hi: "Hi! 👋 I'm ready to help you explore the MPLADS project data.",

      hello:
        "Hello! 👋 Ask me about MPLADS projects, risks, expenditure, states, MPs, or project status.",

      "how are you":
        "I'm doing great! 🤖 I'm ready to help you investigate the MPLADS data.",

      thanks:
        "You're welcome! 😊",

      thankyou:
        "You're welcome! 😊"
    };


    if (casualResponses[lowerMessage]) {

      setMessages(prev => [
        ...prev,

        {
          role: "user",
          content: userMessage
        },

        {
          role: "assistant",
          content: casualResponses[lowerMessage]
        }
      ]);

      setInput("");

      return;
    }


    // --------------------------------
    // ADD USER MESSAGE
    // --------------------------------

    setMessages(prev => [
      ...prev,

      {
        role: "user",
        content: userMessage
      }
    ]);

    setInput("");
    setLoading(true);


    try {

      // --------------------------------
      // CALL BACKEND
      // --------------------------------

      const response = await fetch(
        "http://localhost:5000/api/ai/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            message: userMessage,
            works
          })
        }
      );


      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

const results = data.results || [];

const totalResults =
  data.totalResults ?? results.length;

const allResults =
  data.allResults || results;

      const reply =
        data.reply ||
        `I found ${totalResults} matching projects.`;


      // --------------------------------
      // ADD ASSISTANT MESSAGE
      // --------------------------------

      setMessages(prev => [
        ...prev,

        {
          role: "assistant",

          content: reply,

          // First 5 projects
          results,

          // Total number of matching projects
          totalResults,

          // Complete filtered list
          allResults,

          showAll: false
        }
      ]);

    }


    catch (error) {

      console.error(error);

      setMessages(prev => [
        ...prev,

        {
          role: "assistant",
          content:
            "Sorry, I couldn't process that request."
        }
      ]);

    }


    setLoading(false);
  }


  // --------------------------------
  // ENTER KEY
  // --------------------------------

  function handleKeyDown(e) {

    if (e.key === "Enter") {
      sendMessage();
    }

  }


  // --------------------------------
  // UI
  // --------------------------------

  return (

    <div className="chat-container">


      {/* HEADER */}

      <div className="chat-header">

        <div>

          <h2>
            🤖 MPLADS AI Assistant
          </h2>

          <p>
            Ask questions about the project data
          </p>

        </div>


        <button
          className="chat-close-btn"
          onClick={onClose}
          title="Close assistant"
        >
          ×
        </button>

      </div>



      {/* MESSAGES */}

      <div className="chat-messages">

        {messages.map((message, index) => (

          <div
            key={index}
            className={`message ${message.role}`}
          >


            {/* MESSAGE */}

            <div className="message-bubble">

              {message.content}

            </div>



            {/* RESULTS */}

{message.results?.length > 0 && (

  <div className="chat-results">

    {(message.showAll
      ? message.allResults
      : message.results
    ).map((work, i) => (

      <div
        className="result-card"
        key={work.workId || i}
        onClick={() => onSelectWork(work)}
      >

        <strong>
          {work.workId}
        </strong>

        <p>
          {work.mpName || "MP unavailable"}
        </p>

        <small>
          {work.state || "State unavailable"}
        </small>

        <div className="result-card-footer">

          <span>
            {work.status || "Status unavailable"}
          </span>

          <span className="view-project">
            View details →
          </span>

        </div>

      </div>

    ))}


    {/* VIEW / HIDE BUTTON */}

    {message.totalResults > message.results.length && (

      <button
        className="view-all-btn"
        onClick={() => {

          setMessages(prev =>
            prev.map((msg, msgIndex) =>
              msgIndex === index
                ? {
                    ...msg,
                    showAll: !msg.showAll
                  }
                : msg
            )
          );

        }}
      >

        {message.showAll
          ? "Hide remaining projects ↑"
          : `View remaining ${
              message.totalResults -
              message.results.length
            } projects ↓`
        }

      </button>

    )}

  </div>

)}

          </div>

        ))}


        {/* LOADING */}

        {loading && (

          <div className="message assistant">

            <div className="message-bubble">
              Thinking...
            </div>

          </div>

        )}

      </div>



      {/* INPUT */}

      <div className="chat-input-area">

        <input
          value={input}

          onChange={e =>
            setInput(e.target.value)
          }

          onKeyDown={handleKeyDown}

          placeholder="Ask about MPLADS projects..."
        />


        <button
          onClick={sendMessage}
          disabled={loading}
        >
          ➤
        </button>

      </div>

    </div>

  );

}


export default ChatBox;
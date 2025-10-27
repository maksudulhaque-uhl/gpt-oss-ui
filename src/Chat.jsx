import React, { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const apiEndpoint = "http://172.16.0.165:1234/v1/chat/completions";

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const conversation = [
        {
          role: "system",
          content: "Always answer in rhymes. Today is Thursday",
        },
        ...messages.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: input },
      ];

      const payload = {
        model: "openai/gpt-oss-20b",
        // model: "openai/gpt-oss-120b",
        messages: conversation,
        temperature: 0.7,
        max_tokens: -1,
        stream: false,
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Error response:", errText);
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const botResponse =
        data?.choices?.[0]?.message?.content || "⚠️ No response received.";

      setMessages((prev) => [...prev, { text: botResponse, sender: "bot" }]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Error: Could not connect to LM Studio API.",
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="grow p-6 overflow-y-auto space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 ${
              message.sender === "user" ? "justify-end" : ""
            }`}
          >
            {message.sender === "bot" && (
              <div className="w-8 h-8 bg-transparent border-2 border-green-600 rounded-full" />
            )}
            <div
              className={`max-w-lg px-4 py-3 rounded-2xl ${
                message.sender === "user"
                  ? "bg-green-600 text-white rounded-br-none"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-gray-500 italic text-sm">
            🤔 AI is thinking...
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center">
          <TextareaAutosize
            minRows={1}
            maxRows={5}
            placeholder="Type your message..."
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className={`ml-4 px-6 py-2 font-semibold text-white rounded-full focus:outline-none transition-colors duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

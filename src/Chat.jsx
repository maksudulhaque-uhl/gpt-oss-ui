import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Copy, Check } from "lucide-react";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState(null);
  const messagesEndRef = useRef(null);

  const apiEndpoint = "http://172.16.0.165:1234/v1/chat/completions";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          content:
            "You are a helpful coding assistant. Always provide clear and concise answers with code examples when appropriate.",
        },
        ...messages.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: input },
      ];

      const payload = {
        model: "openai/gpt-oss-20b",
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

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(id);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copyMessage = async (text, messageIndex) => {
    try {
      // Remove markdown formatting for cleaner copy
      const cleanText = text
        .replace(/```[\w]*\n/g, "")
        .replace(/```/g, "")
        .replace(/`([^`]+)`/g, "$1");
      await navigator.clipboard.writeText(cleanText);
      setCopiedMessage(messageIndex);
      setTimeout(() => setCopiedMessage(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatMessage = (text) => {
    const parts = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;

    // Process code blocks
    const textWithCodeBlocks = text.replace(
      codeBlockRegex,
      (match, lang, code) => {
        return `__CODE_BLOCK_${parts.length}__${
          parts.push({
            type: "code",
            lang: lang || "text",
            content: code.trim(),
          }) - 1
        }__`;
      }
    );

    // Split by code block markers
    const segments = textWithCodeBlocks.split(/(__CODE_BLOCK_\d+__)/);

    return segments.map((segment, idx) => {
      const codeBlockMatch = segment.match(/__CODE_BLOCK_(\d+)__/);

      if (codeBlockMatch) {
        const block = parts[parseInt(codeBlockMatch[1])];
        const blockId = `${idx}-${block.lang}`;
        return (
          <div key={idx} className="my-3">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 font-mono flex justify-between items-center">
                <span>{block.lang}</span>
                <button
                  onClick={() => copyToClipboard(block.content, blockId)}
                  className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded"
                >
                  {copiedIndex === blockId ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm text-gray-100 font-mono">
                  {block.content}
                </code>
              </pre>
            </div>
          </div>
        );
      }

      // Process inline code and regular text
      const textParts = segment.split(inlineCodeRegex);
      return (
        <span key={idx}>
          {textParts.map((part, i) => {
            if (i % 2 === 1) {
              return (
                <code
                  key={i}
                  className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono"
                >
                  {part}
                </code>
              );
            }
            return (
              <span key={i} className="whitespace-pre-wrap">
                {part}
              </span>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
                AI Assistant
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Always here to help
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Start a conversation
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Ask me anything about coding, technology, or general questions
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.sender === "bot" && (
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 relative group ${
                  message.sender === "user"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-md border border-gray-200 dark:border-gray-700"
                }`}
              >
                {message.sender === "bot" && (
                  <button
                    onClick={() => copyMessage(message.text, index)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="Copy entire response"
                  >
                    {copiedMessage === index ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                )}
                {message.sender === "bot" ? (
                  <div className="text-sm leading-relaxed pr-8">
                    {formatMessage(message.text)}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </p>
                )}
              </div>

              {message.sender === "user" && (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-end gap-3">
            <textarea
              rows={1}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white text-sm max-h-32 overflow-y-auto"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ minHeight: "44px" }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className={`p-3 rounded-full focus:outline-none transition-all duration-200 flex items-center justify-center ${
                loading || !input.trim()
                  ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl"
              }`}
            >
              <Send
                className={`w-5 h-5 ${
                  loading || !input.trim() ? "text-gray-500" : "text-white"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

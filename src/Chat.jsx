import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Copy, Check, Code, FileText } from "lucide-react";

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

  const parseMessage = (text) => {
    const elements = [];
    const lines = text.split("\n");
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Check for code block
      if (line.trim().startsWith("```")) {
        const lang = line.trim().slice(3).trim() || "text";
        const codeLines = [];
        i++;

        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }

        const codeContent = codeLines.join("\n");
        const blockId = `code-${elements.length}-${Date.now()}`;

        elements.push({
          type: "code",
          lang,
          content: codeContent,
          id: blockId,
        });
        i++;
      }
      // Check for headings
      else if (line.trim().startsWith("#")) {
        const level = line.match(/^#+/)[0].length;
        const content = line.replace(/^#+\s*/, "");
        elements.push({
          type: "heading",
          level,
          content,
        });
        i++;
      }
      // Check for lists
      else if (
        line.trim().match(/^[-*]\s+/) ||
        line.trim().match(/^\d+\.\s+/)
      ) {
        const listItems = [];
        const isOrdered = line.trim().match(/^\d+\.\s+/);

        while (
          i < lines.length &&
          (lines[i].trim().match(/^[-*]\s+/) ||
            lines[i].trim().match(/^\d+\.\s+/))
        ) {
          const content = lines[i].trim().replace(/^[-*\d+.]\s+/, "");
          listItems.push(content);
          i++;
        }

        elements.push({
          type: "list",
          ordered: !!isOrdered,
          items: listItems,
        });
      }
      // Check for tables
      else if (line.includes("|") && lines[i + 1]?.includes("---")) {
        const headers = line
          .split("|")
          .map((h) => h.trim())
          .filter((h) => h);
        i += 2; // Skip header separator
        const rows = [];

        while (i < lines.length && lines[i].includes("|")) {
          const cells = lines[i]
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c);
          rows.push(cells);
          i++;
        }

        elements.push({
          type: "table",
          headers,
          rows,
        });
      }
      // Regular paragraph with inline code
      else if (line.trim()) {
        let paragraph = line;
        let j = i + 1;

        while (
          j < lines.length &&
          lines[j].trim() &&
          !lines[j].trim().startsWith("```") &&
          !lines[j].trim().startsWith("#") &&
          !lines[j].trim().match(/^[-*]\s+/) &&
          !lines[j].trim().match(/^\d+\.\s+/) &&
          !lines[j].includes("|")
        ) {
          paragraph += "\n" + lines[j];
          j++;
        }

        elements.push({
          type: "paragraph",
          content: paragraph,
        });
        i = j;
      } else {
        i++;
      }
    }

    return elements;
  };

  const renderInlineCode = (text) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded text-sm font-mono mx-0.5"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const renderMessage = (text) => {
    const elements = parseMessage(text);

    return elements.map((element, idx) => {
      switch (element.type) {
        case "code":
          return (
            <div
              key={idx}
              className="my-4 rounded-xl overflow-hidden shadow-lg"
            >
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2.5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-gray-300">
                    {element.lang}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(element.content, element.id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-xs font-medium text-gray-200"
                >
                  {copiedIndex === element.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-gray-950 overflow-x-auto">
                <code className="text-sm text-gray-100 font-mono leading-relaxed">
                  {element.content}
                </code>
              </pre>
            </div>
          );

        case "heading":
          const HeadingTag = `h${Math.min(element.level, 6)}`;
          const sizes = {
            1: "text-2xl font-bold",
            2: "text-xl font-bold",
            3: "text-lg font-semibold",
            4: "text-base font-semibold",
          };
          return (
            <HeadingTag
              key={idx}
              className={`${
                sizes[element.level] || sizes[4]
              } text-gray-900 dark:text-gray-100 mt-6 mb-3 first:mt-0`}
            >
              {renderInlineCode(element.content)}
            </HeadingTag>
          );

        case "list":
          const ListTag = element.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={idx}
              className={`my-3 space-y-2 ${
                element.ordered
                  ? "list-decimal list-inside"
                  : "list-disc list-inside"
              }`}
            >
              {element.items.map((item, i) => (
                <li
                  key={i}
                  className="text-gray-800 dark:text-gray-200 leading-relaxed pl-2"
                >
                  {renderInlineCode(item)}
                </li>
              ))}
            </ListTag>
          );

        case "table":
          return (
            <div
              key={idx}
              className="my-4 overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600"
            >
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    {element.headers.map((header, i) => (
                      <th
                        key={i}
                        className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                      >
                        {renderInlineCode(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {element.rows.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200"
                        >
                          {renderInlineCode(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        case "paragraph":
          return (
            <p
              key={idx}
              className="text-gray-800 dark:text-gray-200 leading-relaxed my-3 whitespace-pre-wrap"
            >
              {renderInlineCode(element.content)}
            </p>
          );

        default:
          return null;
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                AI Coding Assistant
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Powered by LM Studio • Always ready to help
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome to AI Assistant
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Ask me anything about coding, debugging, algorithms, or software
                development
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  💡 Code examples
                </div>
                <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  🐛 Debug assistance
                </div>
                <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  📚 Best practices
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 ${
                message.sender === "user" ? "justify-end" : "justify-start"
              } animate-fadeIn`}
            >
              {message.sender === "bot" && (
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl shadow-lg relative group ${
                  message.sender === "user"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-6 py-4"
                }`}
              >
                {message.sender === "bot" && (
                  <button
                    onClick={() => copyMessage(message.text, index)}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm"
                    title="Copy entire response"
                  >
                    {copiedMessage === index ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                )}

                {message.sender === "bot" ? (
                  <div className="pr-10">{renderMessage(message.text)}</div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </p>
                )}
              </div>

              {message.sender === "user" && (
                <div className="w-9 h-9 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 justify-start animate-fadeIn">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 shadow-2xl sticky bottom-0">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                rows={1}
                placeholder="Ask me anything about coding..."
                className="w-full px-5 py-3 pr-12 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white text-sm max-h-40 overflow-y-auto transition-all"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ minHeight: "48px" }}
              />
              <FileText className="absolute right-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className={`p-3.5 rounded-2xl focus:outline-none transition-all duration-200 flex items-center justify-center shadow-lg ${
                loading || !input.trim()
                  ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/50 hover:shadow-xl"
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

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Chat;

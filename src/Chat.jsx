import React, { useState } from 'react';

const Chat = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm an AI assistant. How can I help you today?", sender: 'bot' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { text: input, sender: 'user' };
      setMessages([...messages, userMessage]);
      setInput('');

      // TODO: Replace with your actual backend endpoint
      const apiEndpoint = 'http://localhost:1234/v1/chat/completions'; // Example for LM Studio

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // TODO: Adjust the body to match your backend's expected format
          body: JSON.stringify({
            messages: [{ role: 'user', content: input }],
            temperature: 0.7,
            max_tokens: -1,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // TODO: Adjust how you extract the bot's response based on your backend's output
        const botResponse = data.choices[0].message.content;

        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botResponse, sender: 'bot' },
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: 'Error: Could not connect to the bot.', sender: 'bot' },
        ]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${
                message.sender === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.sender === 'bot' && (
                <div className="w-8 h-8 bg-blue-500 rounded-full" />
              )}
              <div
                className={`max-w-lg px-4 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
                }`}
              >
                <p>{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 bg-white border-t dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Type your message..."
            className="w-full px-4 py-2 bg-gray-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="ml-4 px-6 py-2 font-semibold text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

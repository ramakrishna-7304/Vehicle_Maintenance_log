import React, { useState } from 'react';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = 'AIzaSyDJM2mANLFzwEOLpPsVZJ2ZCHPv1yM1Q2E'; 

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      // Gemini API call
      const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Answer as a car expert: ${input}` }] }],
        }),
      });
      const data = await res.json();
      const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not find an answer.';
      setMessages((prev) => [...prev, { sender: 'bot', text: botText }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Error contacting Gemini API.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-500 dark:bg-sky-300 text-white dark:text-gray-900 border-none shadow-lg text-2xl flex items-center justify-center cursor-pointer z-[1000] transition-colors duration-200 hover:bg-blue-600 dark:hover:bg-sky-600 hover:text-white"
        onClick={() => setOpen((o) => !o)}
      >
        <span role="img" aria-label="chat">💬</span>
      </button>
      {open && (
        <div className="fixed bottom-28 right-8 w-[340px] max-w-[95vw] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl flex flex-col z-[1001] animate-fadeIn transition-colors duration-300">
          <div className="flex justify-between items-center px-5 py-3 bg-blue-500 dark:bg-sky-300 text-white dark:text-gray-900 rounded-t-2xl font-bold text-[1.1rem]">
            <span>Ask CarBot</span>
            <button className="bg-none border-none text-[1.5rem] text-white dark:text-gray-900 cursor-pointer" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="p-4 min-h-[120px] max-h-[260px] overflow-y-auto flex flex-col gap-2.5 bg-white dark:bg-gray-800">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={
                  msg.sender === 'user'
                    ? 'self-end bg-blue-500 dark:bg-sky-300 text-white dark:text-gray-900 px-3.5 py-2 rounded-2xl rounded-br-sm max-w-[80%] break-words'
                    : 'self-start bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3.5 py-2 rounded-2xl rounded-bl-sm max-w-[80%] break-words'
                }
              >
                {msg.text}
              </div>
            ))}
            {loading && <div className="self-start bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3.5 py-2 rounded-2xl rounded-bl-sm max-w-[80%] break-words">Thinking...</div>}
          </div>
          <div className="flex border-t border-gray-200 dark:border-gray-900 p-2.5 bg-white dark:bg-gray-800 rounded-b-2xl">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about cars..."
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-300 disabled:bg-gray-100 dark:disabled:bg-gray-700 transition-colors duration-200"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-blue-500 dark:bg-sky-300 text-white dark:text-gray-900 border-none rounded-lg px-4 py-2 font-bold cursor-pointer transition-colors duration-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot; 
# AI Chatbot

A lightweight web chat app powered by OpenRouter models.

## Features
- Chat with multiple OpenRouter models
- Switch models from the sidebar
- Upload images for supported vision models
- Save API key in browser local storage
- Local chat history with quick conversation switching
- Responsive modern UI built with Tailwind CSS

## Project Structure
- index.html: Main UI layout and styling
- script.js: Chat logic, API calls, model/image handling, and local storage

## Requirements
- A modern web browser (Chrome, Edge, Firefox)
- OpenRouter API key from https://openrouter.ai

## Run Locally
1. Clone the repository:
   git clone https://github.com/munasinghepesandi/AI-Chatbot.git
2. Open the project folder.
3. Start a local static server (recommended):
   - Python:
     python -m http.server 5500
   - Node.js (if serve is installed):
     npx serve .
4. Open the app in your browser:
   - http://localhost:5500 (Python)
   - or the URL shown by npx serve

You can also open index.html directly, but using a local server is recommended.

## How To Use
1. Open the app.
2. Paste your OpenRouter API key in the sidebar and click Save.
3. Select a model.
4. Type a message and send with Ctrl+Enter or the send button.
5. Optional: Upload an image before sending (use a vision model).

## Notes
- API key and conversation history are stored in your browser local storage.
- Uploaded images are sent to the selected model as data URLs.
- Large images (over 4MB) are blocked in the UI.

## Future Improvements
- Add markdown rendering for assistant responses
- Add streaming responses
- Add export/import for chats
- Add dark/light theme toggle

## License
Add your preferred license here (for example, MIT).

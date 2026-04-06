# AI Chatbot

A lightweight web chat app powered by OpenRouter models.

<img scr=""/>

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

## Live Demo
- Click on "simple-aichatbot.netlify.app"

## Notes
- If need the API key, use "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" (if need)
- Save the API key from the bottom of left side button (if need the API key)
- API key and conversation history are stored in your browser local storage.
- Uploaded images are sent to the selected model as data URLs.
- Large images (over 4MB) are blocked in the UI.

## Future Improvements
- Add markdown rendering for assistant responses
- Add streaming responses
- Add export/import for chats
- Add dark/light theme toggle


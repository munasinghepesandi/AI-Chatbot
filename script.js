// Configuration
const API_KEY_STORAGE = 'openrouter_api_key';
const MODEL_STORAGE = 'openrouter_model_id';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL_ID = 'stepfun/step-3.5-flash:free';
const VISION_MODELS = [
    'meta-llama/llama-3.2-11b-vision-instruct:free',
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'google/gemma-3-27b-it:free',
    'google/gemma-3-12b-it:free',
    'google/gemma-3-4b-it:free'
];

// DOM Elements
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistory = document.getElementById('chatHistory');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const modelSelect = document.getElementById('modelSelect');
const imageInput = document.getElementById('imageInput');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const imageName = document.getElementById('imageName');
const removeImageBtn = document.getElementById('removeImageBtn');

// State
let currentMessages = [];
let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
let currentConversationId = null;
let isLoading = false;
let selectedImageDataUrl = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    migrateStoredConversations();
    loadApiKey();
    loadSelectedModel();
    setupEventListeners();
    loadChatHistory();
});

function migrateStoredConversations() {
    const sanitized = conversations.map((conv) => ({
        ...conv,
        messages: getPersistableMessages(conv.messages || [])
    }));

    const hasChanges = JSON.stringify(sanitized) !== JSON.stringify(conversations);
    if (!hasChanges) {
        return;
    }

    conversations = sanitized;
    try {
        localStorage.setItem('conversations', JSON.stringify(conversations));
    } catch (error) {
        console.warn('Could not migrate stored conversations:', error);
    }
}

function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            sendMessage();
        }
    });
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    modelSelect.addEventListener('change', saveSelectedModel);
    newChatBtn.addEventListener('click', startNewChat);
    clearHistoryBtn.addEventListener('click', clearAllConversations);
    userInput.addEventListener('input', autoResize);
    uploadImageBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageSelect);
    removeImageBtn.addEventListener('click', clearSelectedImage);
}

function autoResize() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
}

function loadApiKey() {
    const savedKey = localStorage.getItem(API_KEY_STORAGE);
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
}

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (!key) {
        alert('Please enter an API key');
        return;
    }
    localStorage.setItem(API_KEY_STORAGE, key);
    alert('API key saved successfully!');
}

function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE);
}

function loadSelectedModel() {
    const savedModel = localStorage.getItem(MODEL_STORAGE);
    if (savedModel && Array.from(modelSelect.options).some((opt) => opt.value === savedModel)) {
        modelSelect.value = savedModel;
        return;
    }
    modelSelect.value = DEFAULT_MODEL_ID;
}

function saveSelectedModel() {
    localStorage.setItem(MODEL_STORAGE, modelSelect.value);
}

function getSelectedModel() {
    return modelSelect.value || DEFAULT_MODEL_ID;
}

function startNewChat(shouldClearComposer = true) {
    currentMessages = [];
    currentConversationId = Date.now().toString();
    if (shouldClearComposer) {
        clearSelectedImage();
    }
    messagesContainer.innerHTML = `
        <div class="flex justify-center items-center h-full">
            <div class="text-center text-slate-300">
                <h2 class="title-font mb-2 text-2xl font-bold sm:text-3xl">How can I help you today?</h2>
                <p class="text-sm sm:text-base text-slate-400">Upload images, switch models, and chat naturally.</p>
            </div>
        </div>
    `;
    userInput.focus();
    saveChatHistory();
}

function loadChatHistory() {
    chatHistory.innerHTML = '';
    conversations.forEach(conv => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-slate-800';

        const titleBtn = document.createElement('button');
        titleBtn.type = 'button';
        titleBtn.className = 'min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm font-medium text-slate-200 transition hover:text-white';
        titleBtn.textContent = conv.title || 'New Chat';
        titleBtn.title = conv.title || 'New Chat';
        titleBtn.addEventListener('click', () => loadConversation(conv.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-300 transition hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-300';
        deleteBtn.textContent = 'Delete';
        deleteBtn.title = 'Delete this chat';
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteConversation(conv.id);
        });

        row.appendChild(titleBtn);
        row.appendChild(deleteBtn);
        chatHistory.appendChild(row);
    });
}

function deleteConversation(convId) {
    const targetConversation = conversations.find((conversation) => conversation.id === convId);
    const title = targetConversation?.title || 'this chat';
    const shouldDelete = confirm(`Delete "${title}"? This cannot be undone.`);
    if (!shouldDelete) {
        return;
    }

    conversations = conversations.filter((conversation) => conversation.id !== convId);
    localStorage.setItem('conversations', JSON.stringify(conversations));

    if (currentConversationId === convId) {
        currentConversationId = null;
        currentMessages = [];
        renderMessages();
    }

    loadChatHistory();
}

function clearAllConversations() {
    if (conversations.length === 0) {
        return;
    }

    const shouldDeleteAll = confirm('Delete all saved chats? This cannot be undone.');
    if (!shouldDeleteAll) {
        return;
    }

    conversations = [];
    localStorage.setItem('conversations', JSON.stringify(conversations));
    currentConversationId = null;
    currentMessages = [];
    renderMessages();
    loadChatHistory();
}

function loadConversation(convId) {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
        currentConversationId = convId;
        currentMessages = normalizeLoadedMessages(conv.messages || []);
        renderMessages();
    }
}

function saveChatHistory() {
    if (currentMessages.length === 0) return;

    let conv = conversations.find(c => c.id === currentConversationId);
    if (!conv) {
        const firstMessageText = extractMessageText(currentMessages[0]);
        conv = {
            id: currentConversationId,
            title: firstMessageText ? `${firstMessageText.substring(0, 30)}...` : 'New Chat',
            messages: []
        };
        conversations.push(conv);
    }
    conv.messages = getPersistableMessages(currentMessages);
    try {
        localStorage.setItem('conversations', JSON.stringify(conversations));
        loadChatHistory();
    } catch (error) {
        console.warn('Could not persist chat history:', error);
    }
}

async function sendMessage() {
    const message = userInput.value.trim();
    const hasImage = Boolean(selectedImageDataUrl);
    if ((!message && !hasImage) || isLoading) return;

    const selectedModel = getSelectedModel();
    if (hasImage && !isVisionModel(selectedModel)) {
        alert('The selected model is text-only. Please choose a vision model (for example: meta-llama/llama-3.2-11b-vision-instruct:free or nvidia/nemotron-nano-12b-v2-vl:free).');
        modelSelect.focus();
        return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        alert('Please enter your OpenRouter API key first');
        apiKeyInput.focus();
        return;
    }

    // Initialize conversation if needed
    if (!currentConversationId) {
        startNewChat(false);
    }

    // Add user message
    const userMessageContent = buildUserMessageContent(message, selectedImageDataUrl);
    currentMessages.push({
        role: 'user',
        content: userMessageContent
    });

    userInput.value = '';
    autoResize();
    clearSelectedImage();
    isLoading = true;
    sendBtn.disabled = true;

    renderMessages();
    saveChatHistory();

    try {
        // Call OpenRouter API
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Chatbot',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: getApiReadyMessages(currentMessages),
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `API error: ${response.statusText}`);
        }

        const data = await response.json();
        const assistantMessage = extractAssistantMessage(data);

        // Add assistant message
        currentMessages.push({
            role: 'assistant',
            content: assistantMessage
        });

        renderMessages();
        saveChatHistory();
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
        // Remove failed user message
        currentMessages.pop();
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function renderMessages() {
    if (currentMessages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="flex justify-center items-center h-full">
                <div class="text-center text-slate-300">
                    <h2 class="title-font mb-2 text-2xl font-bold sm:text-3xl">How can I help you today?</h2>
                    <p class="text-sm sm:text-base text-slate-400">Upload images, switch models, and chat naturally.</p>
                </div>
            </div>
        `;
        return;
    }

    messagesContainer.innerHTML = currentMessages.map(msg => `
        <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-2xl ${msg.role === 'user' 
                ? 'rounded-2xl rounded-tr-none bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/30' 
                : 'rounded-2xl rounded-tl-none border border-slate-700 bg-slate-900 text-slate-100 shadow-sm'} px-4 py-3">
                ${renderMessageContent(msg.content)}
            </div>
        </div>
    `).join('');

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function extractAssistantMessage(data) {
    if (typeof data?.error?.message === 'string' && data.error.message.trim()) {
        throw new Error(data.error.message);
    }

    const choice = data?.choices?.[0];
    const content = choice?.message?.content;

    if (typeof content === 'string' && content.trim()) {
        return content;
    }

    if (Array.isArray(content)) {
        const text = content
            .filter((part) => part?.type === 'text' && typeof part.text === 'string')
            .map((part) => part.text)
            .join('\n')
            .trim();

        if (text) {
            return text;
        }
    }

    throw new Error('No assistant message was returned. The selected model may not support image inputs; try meta-llama/llama-3.2-11b-vision-instruct:free.');
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        clearSelectedImage();
        return;
    }

    if (file.size > 4 * 1024 * 1024) {
        alert('Image is too large. Please upload an image under 4MB.');
        clearSelectedImage();
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        selectedImageDataUrl = reader.result;
        imagePreview.src = selectedImageDataUrl;
        imageName.textContent = file.name;
        imagePreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function clearSelectedImage() {
    selectedImageDataUrl = null;
    imageInput.value = '';
    imagePreview.src = '';
    imageName.textContent = '';
    imagePreviewContainer.classList.add('hidden');
}

function buildUserMessageContent(text, imageDataUrl) {
    const parts = [];

    if (text) {
        parts.push({
            type: 'text',
            text
        });
    }

    if (imageDataUrl) {
        parts.push({
            type: 'image_url',
            image_url: {
                url: imageDataUrl
            }
        });
    }

    if (!imageDataUrl) {
        return text;
    }

    return parts;
}

function isVisionModel(modelId) {
    return VISION_MODELS.includes(modelId);
}

function getApiReadyMessages(messages) {
    return messages.map((message) => {
        if (!Array.isArray(message.content)) {
            return message;
        }

        const content = message.content
            .filter((part) => {
                if (part?.type === 'text' && typeof part.text === 'string') {
                    return true;
                }

                if (part?.type === 'image_url') {
                    const url = part.image_url?.url;
                    return typeof url === 'string' && (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://'));
                }

                return false;
            })
            .map((part) => {
                if (part.type === 'text') {
                    return { type: 'text', text: part.text };
                }

                return {
                    type: 'image_url',
                    image_url: { url: part.image_url.url }
                };
            });

        return {
            ...message,
            content
        };
    });
}

function getPersistableMessages(messages) {
    return messages.map((message) => {
        if (!Array.isArray(message.content)) {
            return message;
        }

        const sanitizedContent = message.content.map((part) => {
            if (part.type === 'image_url') {
                return {
                    type: 'image_url',
                    image_url: {
                        url: '[image-uploaded]'
                    }
                };
            }
            return part;
        });

        return {
            ...message,
            content: sanitizedContent
        };
    });
}

function normalizeLoadedMessages(messages) {
    return messages.map((message) => {
        if (!Array.isArray(message.content)) {
            return message;
        }

        const normalizedContent = message.content.map((part) => {
            if (part.type !== 'image_url') {
                return part;
            }

            const imageUrl = part.image_url?.url || '';
            if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image/')) {
                return part;
            }

            return {
                type: 'text',
                text: '[Image uploaded previously]'
            };
        });

        return {
            ...message,
            content: normalizedContent
        };
    });
}

function renderMessageContent(content) {
    if (typeof content === 'string') {
        return `<p class="whitespace-pre-wrap text-sm">${escapeHtml(content)}</p>`;
    }

    if (!Array.isArray(content)) {
        return '<p class="whitespace-pre-wrap text-sm"></p>';
    }

    return content.map((part) => {
        if (part.type === 'text') {
            return `<p class="whitespace-pre-wrap text-sm mb-2">${escapeHtml(part.text || '')}</p>`;
        }
        if (part.type === 'image_url' && part.image_url?.url) {
            if (!part.image_url.url.startsWith('data:image/')) {
                return '<p class="whitespace-pre-wrap text-sm italic opacity-80">[Image uploaded]</p>';
            }
            return `<img src="${escapeHtmlAttribute(part.image_url.url)}" alt="Uploaded image" class="max-w-xs rounded-lg border border-slate-700">`;
        }
        return '';
    }).join('');
}

function extractMessageText(message) {
    if (!message || message.role !== 'user') return '';
    const content = message.content;

    if (typeof content === 'string') {
        return content;
    }

    if (Array.isArray(content)) {
        const textPart = content.find((part) => part.type === 'text' && typeof part.text === 'string' && part.text.trim());
        if (textPart) {
            return textPart.text;
        }
        const hasImage = content.some((part) => part.type === 'image_url');
        if (hasImage) {
            return '[Image]';
        }
    }

    return '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeHtmlAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

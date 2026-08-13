/* ==========================================================================
   LOKESH GARG - FLOATING AI PORTFOLIO ASSISTANT WIDGET (ai-assistant.js)
   Black & Orange Theme (#eb5d3a)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initAIAssistantWidget();
});

function initAIAssistantWidget() {
    if (document.getElementById('ai-assistant-btn')) return;

    // Inject Floating Button
    const btn = document.createElement('button');
    btn.id = 'ai-assistant-btn';
    btn.setAttribute('aria-label', 'Open AI Portfolio Assistant');
    btn.innerHTML = '<i class="ri-sparkling-fill"></i>';
    document.body.appendChild(btn);

    // Inject Floating Window
    const win = document.createElement('div');
    win.id = 'ai-assistant-window';
    win.innerHTML = `
        <div class="ai-header">
            <div class="flex-center gap-12">
                <div class="nav-logo-icon" style="width: 28px; height: 28px; font-size: 14px;"><i class="ri-robot-line"></i></div>
                <div>
                    <div style="font-weight: 700; font-size: 14px; color: #fff;">AI Portfolio Assistant</div>
                    <div style="font-size: 11px; color: #eb5d3a;">Powered by Lokesh's Knowledge Base</div>
                </div>
            </div>
            <button id="ai-close-btn" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px;"><i class="ri-close-line"></i></button>
        </div>
        <div class="ai-body" id="ai-messages">
            <div class="ai-msg ai-msg-bot">
                👋 Hello! I am Lokesh's AI Assistant. Ask me anything about his AI projects, RAG architectures, skills, education, or contact details!
            </div>
        </div>
        <form class="ai-input-area" id="ai-form">
            <input type="text" id="ai-input" placeholder="Ask about Lokesh's AI work..." required autocomplete="off">
            <button type="submit" aria-label="Send message"><i class="ri-send-plane-fill"></i></button>
        </form>
    `;
    document.body.appendChild(win);

    // Event Listeners
    btn.addEventListener('click', () => {
        win.classList.toggle('active');
        if (win.classList.contains('active')) {
            document.getElementById('ai-input').focus();
        }
    });

    document.getElementById('ai-close-btn').addEventListener('click', () => {
        win.classList.remove('active');
    });

    const form = document.getElementById('ai-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('ai-input');
        const text = input.value.trim();
        if (!text) return;

        appendAIMessage(text, 'user');
        input.value = '';

        // Process query
        setTimeout(() => {
            const botReply = generateAIResponse(text);
            appendAIMessage(botReply, 'bot');
        }, 500);
    });
}

function appendAIMessage(msg, sender) {
    const container = document.getElementById('ai-messages');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `ai-msg ai-msg-${sender}`;
    el.innerHTML = msg;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
}

/**
 * Smart Intent Parser for Portfolio Inquiries
 */
function generateAIResponse(query) {
    const q = query.toLowerCase();

    if (q.includes('skill') || q.includes('stack') || q.includes('python') || q.includes('langchain') || q.includes('rag')) {
        return '🚀 <strong>Lokesh\'s Core Tech Stack:</strong><br/>• <strong>AI & LLMs:</strong> LangChain, LlamaIndex, RAG Pipelines, Agentic Workflows, OpenAI, Groq, Ollama<br/>• <strong>Vector DBs:</strong> Pinecone, ChromaDB<br/>• <strong>Development:</strong> Python, FastAPI, React, Next.js, MySQL, MongoDB';
    }

    if (q.includes('project') || q.includes('work') || q.includes('ai system') || q.includes('agent')) {
        return '💻 <strong>Key AI Projects:</strong><br/>1. <strong>Agentic RAG Assistant:</strong> Multi-agent vector search over complex documents using LangChain & Groq.<br/>2. <strong>Autonomous Data Analyst:</strong> Conversational SQL & Data visualization agent.<br/>3. <strong>FastAPI AI Microservices:</strong> High-throughput inference server.';
    }

    if (q.includes('education') || q.includes('cgpa') || q.includes('college') || q.includes('degree')) {
        return '🎓 <strong>Education Background:</strong><br/>• <strong>Bachelor of Technology:</strong> Computer Science / AI & Data Science (Current CGPA: 8.5+)<br/>• <strong>Relevant Coursework:</strong> Machine Learning, Deep Learning, Data Structures, DBMS, Cloud Computing.';
    }

    if (q.includes('contact') || q.includes('email') || q.includes('hire') || q.includes('reach') || q.includes('phone')) {
        return '📬 <strong>Get in Touch with Lokesh:</strong><br/>• <strong>Email:</strong> <a href="mailto:lokeshgarg486@gmail.com" style="color:#eb5d3a;">lokeshgarg486@gmail.com</a><br/>• <strong>LinkedIn:</strong> <a href="https://linkedin.com/in/lokesh-kumar-garg" target="_blank" style="color:#eb5d3a;">linkedin.com/in/lokesh-kumar-garg</a><br/>• <strong>Location:</strong> New Delhi, India';
    }

    if (q.includes('resume') || q.includes('cv') || q.includes('download')) {
        return '📄 You can download Lokesh\'s updated Resume directly using the <strong>Download CV</strong> button in the Hero section or on the About page!';
    }

    if (q.includes('who') || q.includes('lokesh') || q.includes('about') || q.includes('profile')) {
        return '👨‍💻 <strong>Lokesh Kumar Garg</strong> is a passionate <strong>AI Engineer & Data Scientist</strong> dedicated to building production-ready LLM agents, scalable RAG architectures, and intelligent data systems.';
    }

    return '✨ I can answer questions about Lokesh\'s <strong>AI Projects</strong>, <strong>Technical Skills</strong>, <strong>Education & CGPA</strong>, <strong>Resume</strong>, or <strong>Contact Information</strong>. What would you like to know?';
}

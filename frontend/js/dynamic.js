/* ==========================================================================
   LOKESH GARG - DYNAMIC DATA & API ENGINE (dynamic.js)
   ========================================================================== */

const API_BASE_URL = (['localhost', '127.0.0.1'].includes(window.location.hostname))
    ? 'http://localhost:8000/api'
    : 'https://REPLACE-WITH-DEPLOYED-BACKEND-URL/api';

// Core Fetch Utility with Graceful Offline Fallback
async function fetchData(endpoint) {
    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn(`[dynamic.js] Backend unavailable at ${endpoint}. Using offline fallback dataset.`);
        return getFallbackData(endpoint);
    }
}

// Analytics Event Tracker (Fire & Forget)
async function trackEvent(eventType, page) {
    try {
        await fetch(`${API_BASE_URL}/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_type: eventType, page })
        });
    } catch (_) {}
}

/* ==========================================================================
   RICH FALLBACK DATASET (Guarantees 100% complete render offline or online)
   ========================================================================== */
function getFallbackData(endpoint) {
    if (endpoint.includes('/profile')) {
        return {
            name: "Lokesh Kumar Garg",
            tagline: "AI Engineer & Data Scientist",
            location: "New Delhi, India",
            bio: "Passionate AI Engineer and Data Scientist building production-ready LLM agents, scalable RAG architectures, and intelligent data systems. Expert in turning raw data into interactive AI solutions.",
            profile_photo_url: "assets/images/about/profile.png",
            resume_url: "https://drive.google.com/file/d/1example/view",
            available_for_freelance: true
        };
    }

    if (endpoint.includes('/skills')) {
        return [
            { name: "Python", domain: "Programming", proficiency: "Expert", icon_class: "ri-code-s-slash-line" },
            { name: "C++", domain: "Programming", proficiency: "Advanced", icon_class: "ri-terminal-box-line" },
            { name: "JavaScript", domain: "Programming", proficiency: "Advanced", icon_class: "ri-javascript-line" },
            { name: "SQL", domain: "Programming", proficiency: "Expert", icon_class: "ri-database-2-line" },
            
            { name: "LangChain", domain: "AI & LLM", proficiency: "Expert", icon_class: "ri-brain-line" },
            { name: "RAG Pipelines", domain: "AI & LLM", proficiency: "Expert", icon_class: "ri-node-tree" },
            { name: "Agentic AI", domain: "AI & LLM", proficiency: "Expert", icon_class: "ri-robot-line" },
            { name: "Prompt Engineering", domain: "AI & LLM", proficiency: "Expert", icon_class: "ri-chat-voice-line" },
            { name: "LlamaIndex", domain: "AI & LLM", proficiency: "Advanced", icon_class: "ri-book-read-line" },
            { name: "OpenAI API", domain: "AI & LLM", proficiency: "Expert", icon_class: "ri-openai-line" },
            { name: "Gemini", domain: "AI & LLM", proficiency: "Advanced", icon_class: "ri-sparkling-fill" },
            { name: "Groq", domain: "AI & LLM", proficiency: "Expert", icon_class: "ri-cpu-line" },
            
            { name: "React", domain: "Development", proficiency: "Advanced", icon_class: "ri-reactjs-line" },
            { name: "Next.js", domain: "Development", proficiency: "Advanced", icon_class: "ri-arrow-right-circle-line" },
            { name: "Tailwind CSS", domain: "Development", proficiency: "Expert", icon_class: "ri-css3-line" },
            { name: "FastAPI", domain: "Development", proficiency: "Expert", icon_class: "ri-server-line" },
            { name: "Flask", domain: "Development", proficiency: "Advanced", icon_class: "ri-code-box-line" },
            { name: "Firebase", domain: "Development", proficiency: "Intermediate", icon_class: "ri-fire-line" },
            
            { name: "PostgreSQL", domain: "Databases", proficiency: "Advanced", icon_class: "ri-database-line" },
            { name: "MySQL", domain: "Databases", proficiency: "Expert", icon_class: "ri-table-line" },
            { name: "MongoDB", domain: "Databases", proficiency: "Expert", icon_class: "ri-leaf-line" },
            { name: "ChromaDB", domain: "Databases", proficiency: "Expert", icon_class: "ri-folders-line" },
            { name: "Pinecone", domain: "Databases", proficiency: "Advanced", icon_class: "ri-compass-3-line" },
            
            { name: "Git & GitHub", domain: "Tools", proficiency: "Expert", icon_class: "ri-github-line" },
            { name: "VS Code", domain: "Tools", proficiency: "Expert", icon_class: "ri-code-line" },
            { name: "Google Colab", domain: "Tools", proficiency: "Expert", icon_class: "ri-test-tube-line" },
            { name: "Jupyter", domain: "Tools", proficiency: "Expert", icon_class: "ri-book-open-line" },
            { name: "Power BI", domain: "Tools", proficiency: "Advanced", icon_class: "ri-bar-chart-2-line" }
        ];
    }

    if (endpoint.includes('/projects')) {
        return [
            {
                id: "p1",
                title: "Autonomous Agentic RAG Intelligence System",
                domain: "AI & LLM",
                description: "Production-ready multi-agent RAG pipeline using LangChain, Groq Llama-3, and Pinecone vector search over complex enterprise documents.",
                thumbnail_url: "assets/images/twitter-settings.jpg",
                details: "Architected hierarchical vector indexing with hybrid dense-sparse retrieval. Implemented agentic self-reflection and re-ranking for 98% query accuracy.",
                tech_stack: ["LangChain", "Groq", "Pinecone", "FastAPI", "Python", "Tailwind"],
                github_link: "https://github.com/lokeshgarg486hub",
                demo_link: "https://github.com/lokeshgarg486hub",
                featured: true
            },
            {
                id: "p2",
                title: "Conversational SQL & Data Analytics Engine",
                domain: "Data Science",
                description: "Natural language to SQL query generation pipeline with automated Chart.js rendering and automated insights summary.",
                thumbnail_url: "assets/images/color-skin.png",
                details: "Built text-to-SQL AST validation layer to prevent hallucinated queries against PostgreSQL databases.",
                tech_stack: ["Python", "OpenAI API", "PostgreSQL", "FastAPI", "Chart.js"],
                github_link: "https://github.com/lokeshgarg486hub",
                demo_link: "https://github.com/lokeshgarg486hub",
                featured: true
            },
            {
                id: "p3",
                title: "Real-Time Customer Sentiment & Predictive Analytics Dashboard",
                domain: "Machine Learning",
                description: "End-to-end ML classification pipeline for streaming customer reviews with Power BI integration.",
                thumbnail_url: "assets/images/twitter-settings.jpg",
                details: "Trained DistilBERT classifier achieving 94.2% accuracy. Deployed on FastAPI microservice with automated Redis caching.",
                tech_stack: ["Python", "PyTorch", "FastAPI", "Power BI", "MongoDB"],
                github_link: "https://github.com/lokeshgarg486hub",
                demo_link: "https://github.com/lokeshgarg486hub",
                featured: true
            }
        ];
    }

    if (endpoint.includes('/education')) {
        return [
            {
                id: "e1",
                degree: "Bachelor of Technology (B.Tech)",
                institution: "Computer Science & Engineering (AI / Data Science)",
                start_date: "2022",
                end_date: "2026",
                gpa: "8.5 / 10",
                description: "Specialized in Artificial Intelligence, Machine Learning algorithms, Data Structures, and Cloud Computing.",
                highlights: ["Data Structures & Algorithms", "Machine Learning", "Deep Learning", "DBMS", "Software Engineering"]
            },
            {
                id: "e2",
                degree: "Senior Secondary (12th Grade)",
                institution: "CBSE Board (PCM with Computer Science)",
                start_date: "2021",
                end_date: "2022",
                gpa: "90%+",
                description: "Focused on Mathematics, Physics, Chemistry, and Python Programming.",
                highlights: ["Physics", "Mathematics", "Computer Science"]
            }
        ];
    }

    if (endpoint.includes('/internships')) {
        return [
            {
                id: "i1",
                company: "AI Systems Lab",
                role: "AI & ML Engineering Intern",
                duration: "2024 - Present",
                domain: "AI & LLM",
                description: "Developed custom RAG evaluation benchmarks and automated prompt optimization pipelines using LangChain & Groq APIs.",
                certificate_url: "https://github.com/lokeshgarg486hub"
            },
            {
                id: "i2",
                company: "DataTech Solutions",
                role: "Data Science Intern",
                duration: "2023 - 2024",
                domain: "Data Science",
                description: "Built automated data processing pipelines in Python & SQL, created interactive Power BI dashboards for executive analytics.",
                certificate_url: "https://github.com/lokeshgarg486hub"
            }
        ];
    }

    if (endpoint.includes('/certificates')) {
        return [
            {
                id: "c1",
                title: "Deep Learning Specialization",
                issuer: "DeepLearning.AI / Coursera",
                date: "2024",
                domain: "AI & LLM",
                image_url: "assets/images/color-skin.png"
            },
            {
                id: "c2",
                title: "Generative AI & LLM Architecture",
                issuer: "IBM / Coursera",
                date: "2024",
                domain: "AI & LLM",
                image_url: "assets/images/twitter-settings.jpg"
            },
            {
                id: "c3",
                title: "Google Data Analytics Professional Certificate",
                issuer: "Google",
                date: "2023",
                domain: "Data Science",
                image_url: "assets/images/color-skin.png"
            }
        ];
    }

    return [];
}

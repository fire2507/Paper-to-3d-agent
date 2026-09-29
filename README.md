#  Paper3D Studio : Interactive 3D AI Research Agent

Transform static, complex academic papers into dynamic, interactive 3D concept universes powered by Groq LLaMA models, Three.js, and FastAPI.

##  Overview

**Paper3D Studio** bridges the gap between dense academic PDFs and intuitive visual comprehension. Upload any research paper or abstract, and the AI agent instantly parses key concepts, maps their relationships, and renders an interactive 3D scene blueprint. Users can orbit through concept nodes, inspect detailed architectural breakdowns, and converse directly with an embedded RAG research assistant.

---

##  Key Features

*  **Automated 3D Blueprinting**: Converts paper sections, methodologies, and findings into structured 3D graphs (spheres, cubes, toruses).
*  **Ultra-Fast LLM Processing**: Powered by Groq AI (`openai/gpt-oss-20b` & `llama-3.3-70b-versatile`) for instant response times.
*  **Interactive Three.js Canvas**: Smooth orbit controls, dynamic floating nodes, glowing hover feedback, and directional laser connections.
*  **Context-Aware AI Research Chat**: Ask specific questions about equations, datasets, or methodologies grounded directly in the paper's text.
*  **Failover Resilience**: Includes automatic fallback and retry logic to prevent rate limits or API service drops.

---

##  Tech Stack

### **Frontend**
* **Framework**: React.js (Vite)
* **3D Engine**: Three.js, `@react-three/fiber`, `@react-three/drei`
* **Styling & UI**: Tailwind CSS, Lucide Icons

### **Backend**
* **Framework**: Python 3.11, FastAPI, Uvicorn
* **PDF Parsing**: `pypdf` (Streamed in-memory via `io.BytesIO`)
* **AI Provider**: Groq SDK (`groq`)

---

##  Project Structure

```text
paper-to-3d-agent/
├── backend/
│   ├── main.py              # FastAPI server & Groq AI agent logic
│   ├── requirements.txt     # Python backend dependencies
│   └── .env                 # API Keys (Git ignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # React app & Three.js canvas logic
│   │   ├── main.jsx         # App entry point
│   │   └── index.css        # Tailwind directives & layout reset
│   ├── vite.config.js       # Vite configuration
│   └── package.json         # Frontend dependencies & scripts
├── .gitignore               # Secret protection rules
└── README.md

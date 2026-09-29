import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Float } from '@react-three/drei';
import axios from 'axios';
import { 
  UploadCloud, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  X, 
  Info, 
  FileText, 
  RotateCcw,
  Boxes,
  Cpu
} from 'lucide-react';

// --- 3D Node Component ---
function Node3D({ node, isSelected, onSelect }) {
  const meshRef = useRef();

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.x += delta * 0.15;
    }
  });

  const renderGeometry = () => {
    switch (node.shape) {
      case 'cube':
        return <boxGeometry args={[1.2, 1.2, 1.2]} />;
      case 'torus':
        return <torusGeometry args={[0.8, 0.3, 16, 32]} />;
      case 'sphere':
      default:
        return <sphereGeometry args={[0.8, 32, 32]} />;
    }
  };

  const nodeColor = node.color || '#6366f1';

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
      <group position={node.position || [0, 0, 0]}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'default')}
        >
          {renderGeometry()}
          <meshStandardMaterial
            color={isSelected ? '#f59e0b' : nodeColor}
            emissive={isSelected ? '#f59e0b' : nodeColor}
            emissiveIntensity={isSelected ? 0.6 : 0.25}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {isSelected && (
          <mesh>
            <sphereGeometry args={[1.15, 32, 32]} />
            <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.4} />
          </mesh>
        )}

        <Text
          position={[0, 1.4, 0]}
          fontSize={0.35}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#090d16"
        >
          {node.title}
        </Text>
      </group>
    </Float>
  );
}

// --- Connections Component ---
function ConnectionLines({ connections = [], nodes = [] }) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n.position]));

  return (
    <>
      {connections.map((conn, idx) => {
        const start = nodeMap.get(conn.source);
        const end = nodeMap.get(conn.target);

        if (!start || !end) return null;

        return (
          <Line
            key={idx}
            points={[start, end]}
            color="#818cf8"
            lineWidth={2}
            dashed={true}
            dashScale={6}
            dashSize={0.4}
            transparent
            opacity={0.5}
          />
        );
      })}
    </>
  );
}

// --- Main Application ---
export default function App() {
  const [blueprint, setBlueprint] = useState(null);
  const [paperId, setPaperId] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:8000/api/convert-paper', formData);
      setBlueprint(res.data.blueprint);
      setPaperId(res.data.paper_id);
      setChatLog([
        {
          sender: 'ai',
          text: `Paper successfully parsed! I've visualized "${res.data.blueprint.title}" in 3D. Ask me any details about the paper's findings or architecture!`
        }
      ]);
    } catch (err) {
      alert('Error processing paper: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !paperId || chatLoading) return;

    const userMsg = chatInput;
    setChatLog((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/api/chat', {
        paper_id: paperId,
        message: userMsg
      });
      setChatLog((prev) => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (err) {
      setChatLog((prev) => [...prev, { sender: 'ai', text: 'Error retrieving answer.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleReset = () => {
    setBlueprint(null);
    setPaperId('');
    setSelectedNode(null);
    setChatLog([]);
  };

  return (
    <div className="flex h-screen w-screen bg-[#07090e] text-slate-100 font-sans overflow-hidden">
      
      {/* 3D CANVAS & WORKSPACE */}
      <div className="flex-1 relative h-full flex flex-col">
        
        {/* Navigation Header */}
        <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-8 py-5 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-4 py-2 rounded-2xl shadow-xl">
            <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white leading-tight">Paper3D Studio</h1>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400">Interactive Visual AI</p>
            </div>
          </div>

          {blueprint && (
            <button
              onClick={handleReset}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-300 rounded-xl border border-slate-800 backdrop-blur-md transition-all hover:scale-105 shadow-lg"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" /> New Paper
            </button>
          )}
        </header>

        {/* Upload Hero View */}
        {!blueprint ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 relative">
            {/* Background Glow */}
            <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

            <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl shadow-2xl backdrop-blur-2xl">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-indigo-500/30">
                <Cpu className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold mb-3 tracking-tight text-white">Upload Research Paper</h2>
              <p className="text-xs text-slate-400 mb-8 leading-relaxed">
                Transform complex academic PDFs into interactive 3D concept maps. Chat, explore, and master any paper in seconds.
              </p>

              <label className={`w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xl ${
                loading ? 'bg-indigo-900/50 text-indigo-300 cursor-wait border border-indigo-700/50' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 hover:scale-[1.02]'
              }`}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                    Extracting & Rendering Scene...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Select PDF Document
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  disabled={loading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          /* 3D Scene Canvas */
          <div className="flex-1 w-full h-full relative">
            <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
              <ambientLight intensity={0.9} />
              <pointLight position={[10, 10, 10]} intensity={1.5} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

              {blueprint.nodes.map((node) => (
                <Node3D
                  key={node.id}
                  node={node}
                  isSelected={selectedNode?.id === node.id}
                  onSelect={setSelectedNode}
                />
              ))}

              <ConnectionLines connections={blueprint.connections} nodes={blueprint.nodes} />
            </Canvas>

            {/* Instruction Footer Overlay */}
            <div className="absolute bottom-6 left-8 pointer-events-none text-xs text-slate-400 flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 backdrop-blur-md shadow-lg">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>Left-click + drag to orbit | Scroll to zoom | Click any 3D node to inspect</span>
            </div>
          </div>
        )}

        {/* Selected Node Details Floating Panel */}
        {selectedNode && (
          <div className="absolute top-24 left-8 z-30 w-80 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: selectedNode.color || '#6366f1' }} />
                <h3 className="font-semibold text-sm text-indigo-200">{selectedNode.title}</h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.description}</p>
          </div>
        )}
      </div>

      {/* RIGHT CHAT SIDEBAR */}
      {blueprint && (
        <aside className="w-[400px] bg-slate-950 border-l border-slate-800/80 flex flex-col h-full z-20 shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="font-bold text-sm text-slate-100 truncate">{blueprint.title}</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{blueprint.summary}</p>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            {chatLog.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[82%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-2 text-indigo-400 text-xs italic bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                <Bot className="w-4 h-4 animate-bounce" /> Processing research query...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 focus-within:border-indigo-500/80 transition-colors">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask about equations, methodology..."
                className="flex-1 bg-transparent px-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg transition-all shadow-md shadow-indigo-600/20"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../services/socket';
import { getRoom } from '../services/api';
import Whiteboard from '../components/Whiteboard';

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [code, setCode] = useState('// Start coding here...');
  const [roomName, setRoomName] = useState('');
  const [typing, setTyping] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'whiteboard'
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const messagesEndRef = useRef(null);

  // Auto-save code every 5 seconds
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      const saveCode = async () => {
        try {
          await fetch(`http://localhost:5000/api/rooms/${roomId}/code`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ code })
          });
          console.log('✓ Code saved');
        } catch (err) {
          console.error('Save failed:', err);
        }
      };
      
      saveCode();
    }, 5000);

    return () => clearTimeout(saveTimeout);
  }, [code, roomId]);

  useEffect(() => {
    fetchRoom();
    socket.emit('join-room', roomId);

    socket.on('code-update', (newCode) => {
      setCode(newCode);
    });

    socket.on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user-typing', (data) => {
      setTyping(`${data.user} is typing...`);
      setTimeout(() => setTyping(''), 1500);
    });

    return () => {
      socket.off('code-update');
      socket.off('new-message');
      socket.off('user-typing');
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRoom = async () => {
    try {
      const res = await getRoom(roomId);
      setRoomName(res.data.name);
      if (res.data.code) setCode(res.data.code);
    } catch (err) {
      console.error('Room not found');
    }
  };

  const sendMessage = () => {
    if (inputMessage.trim()) {
      socket.emit('send-message', {
        roomId,
        user: user.name || user.email,
        message: inputMessage,
      });
      setInputMessage('');
    }
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    socket.emit('code-change', { roomId, code: newCode });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('⏳ Running code...');
    
    try {
      const res = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          code: code, 
          language: selectedLanguage 
        })
      });
      
      const data = await res.json();
      setOutput(data.output || data.error || '⚠️ No output');
    } catch (err) {
      setOutput('❌ Failed to execute code.');
    } finally {
      setIsRunning(false);
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="room-container">
      <div className="sidebar">
        <div className="editor-header">💬 Chat</div>
        
        {typing && <div style={{ padding: '8px 16px', color: '#667eea', fontSize: '12px', fontStyle: 'italic' }}>{typing}</div>}
        
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className="chat-message">
              <span className="chat-user">{msg.user}</span>
              <span className="chat-time">{msg.time}</span>
              <div>{msg.message}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            onKeyDown={() => socket.emit('typing', { roomId, user: user.name || user.email })}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

      <div className="editor-area">
        <div className="editor-header">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Tab Switcher Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginRight: '15px' }}>
              <button 
                onClick={() => setActiveTab('editor')}
                style={{ 
                  background: activeTab === 'editor' ? '#667eea' : '#334155',
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'editor' ? 'bold' : 'normal'
                }}
              >
                📝 Code Editor
              </button>
              <button 
                onClick={() => setActiveTab('whiteboard')}
                style={{ 
                  background: activeTab === 'whiteboard' ? '#667eea' : '#334155',
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'whiteboard' ? 'bold' : 'normal'
                }}
              >
                🎨 Whiteboard
              </button>
            </div>
            
            {/* Only show these when editor is active */}
            {activeTab === 'editor' && (
              <>
                <span>📁 {roomName}</span>
                
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  style={{ background: '#334155', color: 'white', padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                  <option value="javascript">🟨 JavaScript</option>
                  <option value="python">🐍 Python</option>
                </select>
                
                <button 
                  onClick={runCode}
                  disabled={isRunning}
                  style={{ 
                    background: '#10b981', 
                    padding: '6px 20px', 
                    borderRadius: '40px', 
                    border: 'none', 
                    color: 'white', 
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    opacity: isRunning ? 0.7 : 1
                  }}
                >
                  {isRunning ? '⏳ Running...' : '▶️ Run Code'}
                </button>
              </>
            )}
            
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('✅ Room link copied!');
              }}
              style={{ background: '#3b82f6', padding: '6px 16px', borderRadius: '40px', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px' }}
            >
              📋 Copy Link
            </button>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{ background: '#718096', border: 'none', padding: '5px 10px', borderRadius: 5, cursor: 'pointer' }}>
            Exit
          </button>
        </div>
        
        {/* Conditional Rendering - Editor or Whiteboard */}
        {activeTab === 'editor' ? (
          <>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ 
                background: '#1e293b', 
                color: '#64748b', 
                padding: '24px 12px', 
                fontFamily: 'monospace', 
                fontSize: '14px', 
                textAlign: 'right', 
                borderRight: '1px solid #334155',
                userSelect: 'none'
              }}>
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea 
                className="editor" 
                value={code} 
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                spellCheck={false} 
              />
            </div>
            
            {/* Output Panel */}
            <div style={{ 
              background: '#1e293b', 
              color: '#e2e8f0', 
              padding: '16px 20px', 
              borderTop: '1px solid #334155',
              minHeight: '120px',
              maxHeight: '150px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span>📤</span>
                <strong>Output:</strong>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  (Running {selectedLanguage})
                </span>
              </div>
              <pre style={{ 
                fontFamily: 'monospace', 
                fontSize: '13px', 
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {output || '▶️ Click "Run Code" to execute your code'}
              </pre>
            </div>
          </>
        ) : (
          <Whiteboard roomId={roomId} user={user} />
        )}
      </div>
    </div>
  );
}

export default Room;
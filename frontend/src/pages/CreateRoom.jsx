import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/api';

function CreateRoom() {
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createRoom({ 
        name: roomName, 
        createdBy: user.name || user.email, 
        password 
      });
      navigate(`/room/${res.data.id}`);
    } catch (err) {
      alert('Failed to create room');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>✨ Create New Room</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Room Name" 
            value={roomName} 
            onChange={(e) => setRoomName(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Room Password (optional)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '8px' }}
          />
          <button type="submit">Create Room</button>
        </form>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ marginTop: 10, background: '#718096' }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default CreateRoom;
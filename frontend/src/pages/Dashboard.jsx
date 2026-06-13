import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRooms } from '../services/api';

function Dashboard({ setIsAuth }) {
  const [rooms, setRooms] = useState([]);
  const [roomIdInput, setRoomIdInput] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await getRooms();
      setRooms(res.data);
    } catch (err) {
      console.error('Failed to fetch rooms');
    }
  };

  const logout = () => {
    localStorage.clear();
    setIsAuth(false);
    navigate('/login');
  };

  const joinRoom = () => {
    if (roomIdInput.trim()) {
      navigate(`/room/${roomIdInput}`);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="navbar">
        <h1>⚡ CodeFusion</h1>
        <div>
          <span className="user-name">👋 {user.name}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <input 
          type="text" 
          placeholder="Enter Room ID to join" 
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
          className="room-id-input"
        />
        <button className="join-btn" onClick={joinRoom}>
          🔗 Join Room
        </button>
        <button className="create-btn" onClick={() => navigate('/create-room')}>
          ✨ Create New Room
        </button>
      </div>

      <h2 className="section-title">Your Rooms</h2>
      <div className="rooms-grid">
        {rooms.length === 0 && (
          <div className="empty-state">
            📁 No rooms yet. Create your first room!
          </div>
        )}
        {rooms.map((room) => (
          <div key={room.id} className="room-card" onClick={() => navigate(`/room/${room.id}`)}>
            <h3>📁 {room.name}</h3>
            <div className="room-creator">👤 Created by {room.createdBy}</div>
            <div className="room-participants">👥 {room.participants?.length || 1} participants</div>
            <div className="room-id-badge">🆔 {room.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
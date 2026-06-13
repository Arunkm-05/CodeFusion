import { useEffect, useRef, useState } from 'react';
import socket from '../services/socket';

function Whiteboard({ roomId, user }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    setCtx(context);
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // White background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Socket listeners for drawing
    socket.on('drawing', (data) => {
      drawOnCanvas(data.x, data.y, data.type, data.color, data.size);
    });

    socket.on('clear-canvas', () => {
      clearCanvas();
    });

    return () => {
      socket.off('drawing');
      socket.off('clear-canvas');
    };
  }, []);

  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }
  }, [color, brushSize, ctx]);

  const drawOnCanvas = (x, y, type, drawColor, size) => {
    if (!ctx) return;
    
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = size;
    
    if (type === 'start') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (type === 'draw') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    socket.emit('drawing', {
      roomId,
      x,
      y,
      type: 'start',
      color,
      size: brushSize
    });
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const { x, y } = getCoordinates(e);
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    socket.emit('drawing', {
      roomId,
      x,
      y,
      type: 'draw',
      color,
      size: brushSize
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctx.beginPath();
  };

  const clearCanvas = () => {
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket.emit('clear-canvas', { roomId });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f0f0f0' }}>
      <div style={{ padding: '10px', background: '#2d3748', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'white', fontWeight: 'bold' }}>🎨 Whiteboard</span>
        
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)}
          style={{ width: '40px', height: '40px', cursor: 'pointer', border: '2px solid white', borderRadius: '8px' }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'white', fontSize: '12px' }}>Brush:</span>
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ color: 'white', fontSize: '12px' }}>{brushSize}px</span>
        </div>
        
        <button 
          onClick={clearCanvas}
          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
        >
          🗑️ Clear
        </button>
        
        <span style={{ color: '#94a3b8', fontSize: '12px' }}>
          💡 Draw with your mouse or finger
        </span>
      </div>
      
      <canvas
        ref={canvasRef}
        style={{
          flex: 1,
          cursor: 'crosshair',
          background: 'white',
          borderRadius: '8px',
          margin: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}

export default Whiteboard;
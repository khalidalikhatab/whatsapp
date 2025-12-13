import { useState, useEffect } from 'react';
import './App.css';

// IMPORTANT: Change this to your Render URL after deployment!
// For local testing, use 'http://localhost:3000'
const API_URL = 'https://aistudentshive-whatsapp-bot.hf.space';

function App() {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('loading');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/qr`);
      const data = await res.json();
      setStatus(data.status);
      if (data.qr) {
        setQrCode(data.qr);
      } else {
        setQrCode(null);
      }
    } catch (err) {
      console.error("Error fetching status:", err);
      setStatus('error');
    }
  };

  return (
    <div className="container">
      <h1>WhatsApp Bot Dashboard</h1>
      <p>Hosted on GitHub Pages + Hugging Face</p>

      <div className="card">
        <h2>Connection Status</h2>
        <div className={`status-badge ${status}`}>
          {status.toUpperCase()}
        </div>

        {status === 'scanning' && qrCode && (
          <div className="qr-container">
            <img src={qrCode} alt="Scan this QR Code" />
            <p>Scan with WhatsApp (Linked Devices)</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="success-message">
            ✅ Bot is Active and Listening!
          </div>
        )}

        {status === 'error' && (
          <div className="error-message">
            ❌ Cannot connect to Backend. Is Hugging Face awake?
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

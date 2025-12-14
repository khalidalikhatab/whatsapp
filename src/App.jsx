import { useState, useEffect } from 'react';
import './App.css';

// IMPORTANT: Change this to your backend URL after deployment!
// For local testing, use 'http://localhost:3000'
const API_URL = 'https://whatsapp-go-production.up.railway.app';

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

      // Fetch logs
      const logsRes = await fetch(`${API_URL}/logs`);
      const logsData = await logsRes.json();
      if (logsData.logs) {
        setLogs(logsData.logs);
      }
    } catch (err) {
      console.error("Error fetching status:", err);
      setStatus('error');
    }
  };

  return (
    <div className="container">
      <h1>WhatsApp Bot Dashboard</h1>
      <p>Hosted on GitHub Pages + Railway</p>

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
            ❌ Cannot connect to Backend. Check if Railway is running.
          </div>
        )}
      </div>

      <div className="card logs-card">
        <h3>Server Logs</h3>
        <div className="logs-container">
          {logs.length === 0 ? (
            <p>No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="log-entry">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const WORKFLOWS = {
  PUSH: ['flat', 'incline', 'ropePush', 'skullCrush'],
  PULL: ['latPull', 'dbRow', 'dbCurl', 'bbCurl']
};

const EXERCISE_CONFIG = {
  flat: { name: "בנץ' פרס רגיל", color: "#1e40af", isBig: true },
  incline: { name: "שיפוע חיובי משקולות", color: "#3b82f6", isBig: true },
  ropePush: { name: "פשיטת מרפקים חבל", color: "#60a5fa", isBig: false },
  skullCrush: { name: "Skull Crusher מוט", color: "#93c5fd", isBig: false },
  latPull: { name: "פולי עליון רחב", color: "#6d28d9", isBig: true },
  dbRow: { name: "חתירה עם משקולת", color: "#8b5cf6", isBig: true },
  dbCurl: { name: "כפיפת מרפקים משקולות", color: "#a78bfa", isBig: false },
  bbCurl: { name: "יד קדמית מוט אולימפי", color: "#c084fc", isBig: false }
};

const GOOGLE_CLIENT_ID = "348003759546-rl3l7bpekqct6gve9vmsupm2qsbcvpg4.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [accessToken, setAccessToken] = useState(null);
  const [syncStatus, setSyncStatus] = useState("יומן לא מחובר ❌");
  const [sessions, setSessions] = useState([]);
  
  const [customName, setCustomName] = useState("");
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState("18:00");

  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [tempWorkoutData, setTempWorkoutData] = useState({});
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [selectedExKey, setSelectedExKey] = useState("");

  const chartRefs = useRef({});
  const touchStart = useRef(0);

  // לוגיקת גלילה (Swipe)
  const handleTouchStart = (e) => (touchStart.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeTab < 3) setActiveTab(activeTab + 1);
      else if (diff < -50 && activeTab > 0) setActiveTab(activeTab - 1);
    }
  };

  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('gym_sessions')) || [];
    setSessions(savedSessions);
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get("access_token");
    if (token) {
      setAccessToken(token);
      setSyncStatus("מחובר ומסונכרן באופן מלא! 🎉");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleLogin = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authUrl;
  };

  const createGoogleEvent = async (title, description, dateStr, timeStr) => {
    if (!accessToken) return false;
    const startDateTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    const endDateTime = new Date(new Date(`${dateStr}T${timeStr}:00`).getTime() + 60 * 60 * 1000).toISOString();
    const event = { summary: title, description: description, start: { dateTime: startDateTime, timeZone: 'Asia/Jerusalem' }, end: { dateTime: endDateTime, timeZone: 'Asia/Jerusalem' } };
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    return response.ok;
  };

  const addExerciseToTemp = () => {
    if (!selectedExKey || !weightInput || !repsInput) return;
    setTempWorkoutData({...tempWorkoutData, [selectedExKey]: { weight: weightInput, reps: repsInput }});
    setWeightInput(""); setRepsInput("");
  };

  const finalizeWorkout = async () => {
    const newSession = { id: Date.now(), split: activeWorkflow, date: new Date().toLocaleDateString('he-IL'), exercises: tempWorkoutData };
    const newSessionsList = [newSession, ...sessions];
    setSessions(newSessionsList);
    localStorage.setItem('gym_sessions', JSON.stringify(newSessionsList));
    
    if (accessToken) {
      let desc = "אימון משקלים:\n" + Object.keys(tempWorkoutData).map(k => `${EXERCISE_CONFIG[k].name}: ${tempWorkoutData[k].weight}kg x ${tempWorkoutData[k].reps}`).join('\n');
      await createGoogleEvent(`אימון ${activeWorkflow}`, desc, new Date().toISOString().split('T')[0], "18:00");
    }
    setTempWorkoutData({}); setActiveWorkflow(null);
    alert("האימון נשמר!");
  };

  const buildCharts = () => {
    const chronological = [...sessions].reverse();
    Object.keys(EXERCISE_CONFIG).forEach(key => {
      const dataPoints = [];
      const labels = [];
      chronological.forEach(s => {
        if (s.exercises && s.exercises[key]) {
          dataPoints.push(s.exercises[key].weight);
          labels.push(s.date);
        }
      });
      const canvas = document.getElementById(`chart-${key}`);
      if (canvas && dataPoints.length > 0) {
        if (chartRefs.current[key]) chartRefs.current[key].destroy();
        chartRefs.current[key] = new Chart(canvas.getContext('2d'), { type: 'line', data: { labels, datasets: [{ data: dataPoints, borderColor: '#1e40af', borderWidth: 3 }] }, options: { responsive: true } });
      }
    });
  };

  return (
    <div style={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div style={styles.header}>
        <h1 style={styles.title}>TRACK & GAIN</h1>
        <div style={styles.tabsNav}>
          {['יומן', 'מטרות', 'אימון', 'גרפים'].map((t, i) => (
            <button key={i} style={{...styles.tabBtn, ...(activeTab===i?styles.activeTab:{})}} onClick={()=>setActiveTab(i)}>{t}</button>
          ))}
        </div>
      </div>

      <div style={styles.mainContent}>
        {activeTab === 2 && (
          <div style={styles.card}>
            {!activeWorkflow ? (
              <>
                <button style={styles.bigSplitBtn} onClick={() => {setActiveWorkflow('PUSH'); setSelectedExKey(WORKFLOWS.PUSH[0])}}>אימון PUSH</button>
                <button style={styles.bigSplitBtn} onClick={() => {setActiveWorkflow('PULL'); setSelectedExKey(WORKFLOWS.PULL[0])}}>אימון PULL</button>
              </>
            ) : (
              <>
                <select style={styles.input} onChange={e => setSelectedExKey(e.target.value)}>
                  {WORKFLOWS[activeWorkflow].map(k => <option key={k} value={k}>{EXERCISE_CONFIG[k].name}</option>)}
                </select>
                <input style={styles.input} placeholder="משקל" value={weightInput} onChange={e => setWeightInput(e.target.value)}/>
                <input style={styles.input} placeholder="חזרות" value={repsInput} onChange={e => setRepsInput(e.target.value)}/>
                <button style={styles.submitBtn} onClick={addExerciseToTemp}>הוסף תרגיל לסל</button>
                <button style={{...styles.submitBtn, backgroundColor:'#10b981'}} onClick={finalizeWorkout}>סיים ושמור אימון מלא</button>
              </>
            )}
          </div>
        )}
        {/* ... שאר הטאבים כפי שהיו לך ... */}
      </div>
    </div>
  );
}

const styles = {
  container: { direction: 'rtl', fontFamily: 'sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh', padding: '20px 10px' },
  header: { maxWidth: 500, margin: '0 auto 20px auto', textAlign: 'center' },
  title: { color: '#1e40af', margin: 0, fontSize: '2rem' },
  tabsNav: { display: 'flex', backgroundColor: '#fff', padding: 4, borderRadius: 12, border: '1px solid #cbd5e1', gap: 4 },
  tabBtn: { flex: 1, padding: '10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#64748b', fontWeight: 'bold' },
  activeTab: { backgroundColor: '#1e40af', color: '#fff' },
  mainContent: { maxWidth: 500, margin: '0 auto' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, border: '1px solid #cbd5e1', marginBottom: 15 },
  input: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: 10 },
  submitBtn: { width: '100%', padding: 14, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', marginTop: 10 },
  bigSplitBtn: { width: '100%', padding: 20, fontSize: '1.15rem', fontWeight: 'bold', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 12, cursor: 'pointer', marginTop: 15 }
};

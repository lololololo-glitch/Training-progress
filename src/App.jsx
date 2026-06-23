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
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [activeWorkoutData, setActiveWorkoutData] = useState({});

  const chartRefs = useRef({});

  // --- תוספת ה-Swipe ---
  const touchStart = useRef(0);
  const handleTouchStart = (e) => (touchStart.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 80) {
      if (diff > 0 && activeTab < 3) setActiveTab(activeTab + 1);
      else if (diff < 0 && activeTab > 0) setActiveTab(activeTab - 1);
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

  useEffect(() => {
    if (activeTab === 3 && sessions.length > 0) buildCharts();
  }, [activeTab, sessions]);

  const handleGoogleLogin = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authUrl;
  };

  const createGoogleEvent = async (title, description, dateStr, timeStr) => {
    if (!accessToken) { alert("היומן אינו מחובר!"); return false; }
    const startDateTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    const endDateTime = new Date(new Date(`${dateStr}T${timeStr}:00`).getTime() + 60 * 60 * 1000).toISOString();
    const event = { summary: title, description: description, start: { dateTime: startDateTime, timeZone: 'Asia/Jerusalem' }, end: { dateTime: endDateTime, timeZone: 'Asia/Jerusalem' } };
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      return response.ok;
    } catch (err) { console.error(err); return false; }
  };

  const handleAddCustomActivity = async () => {
    if (!customName) return alert("אנא הזן את שם הפעילות!");
    const success = await createGoogleEvent(customName, "פעילות חופשית מ-Track & Gain 🏃‍♂️", customDate, customTime);
    if (success) { alert(`הפעילות "${customName}" סונכרנה בהצלחה!`); setCustomName(""); }
    else { alert("שגיאה בסנכרון."); }
  };

  // --- תוספת: שמירת כל התרגילים בבת אחת ---
  const addExerciseToSession = (key) => {
    if (!weightInput || !repsInput) return alert("הזן משקל וחזרות");
    setActiveWorkoutData({...activeWorkoutData, [key]: { weight: weightInput, reps: repsInput }});
    setWeightInput(""); setRepsInput("");
  };

  const finishAndSaveWorkout = async () => {
    const rawDate = new Date();
    const newSession = {
      id: Date.now(),
      split: activeWorkflow,
      date: rawDate.toLocaleDateString('he-IL'),
      exercises: activeWorkoutData
    };
    const newSessionsList = [newSession, ...sessions];
    setSessions(newSessionsList);
    localStorage.setItem('gym_sessions', JSON.stringify(newSessionsList));
    if (accessToken) {
       let desc = "אימון משקלים:\n" + Object.keys(activeWorkoutData).map(k => `${EXERCISE_CONFIG[k].name}: ${activeWorkoutData[k].weight}kg x ${activeWorkoutData[k].reps}`).join('\n');
       await createGoogleEvent(`💪 אימון ${activeWorkflow}`, desc, rawDate.toISOString().split('T')[0], "18:00");
    }
    setActiveWorkflow(null); setActiveWorkoutData({});
    alert("האימון נשמר!");
  };

  const buildCharts = () => {
    const chronological = [...sessions].reverse();
    Object.keys(EXERCISE_CONFIG).forEach(key => {
      const dataPoints = []; const labels = [];
      chronological.forEach(s => { if (s.exercises && s.exercises[key]) { dataPoints.push(s.exercises[key].weight); labels.push(s.date); }});
      const canvas = document.getElementById(`chart-${key}`);
      if (canvas && dataPoints.length > 0) {
        if (chartRefs.current[key]) chartRefs.current[key].destroy();
        chartRefs.current[key] = new Chart(canvas.getContext('2d'), { type: 'line', data: { labels, datasets: [{ data: dataPoints, borderColor: '#1e40af', borderWidth: 3, tension: 0.15 }] }, options: { responsive: true, plugins: { legend: { display: false } } } });
      }
    });
  };

  return (
    <div style={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div style={styles.header}>
        <h1 style={styles.title}>TRACK & GAIN</h1>
        <p style={styles.subtitle}>ריאקט + סנכרון יומן מלא וגרפים</p>
        <div style={styles.tabsNav}>
          {['📅 יומן', '🎯 מטרות', '📝 אימון', '📊 אנליטיקה'].map((t, i) => (
            <button key={i} style={{...styles.tabBtn, ...(activeTab===i?styles.activeTab:{})}} onClick={()=>setActiveTab(i)}>{t}</button>
          ))}
        </div>
      </div>

      <div style={styles.mainContent}>
        {activeTab === 0 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🔗 חיבור ישיר ליומן גוגל</h2>
            <button style={styles.googleBtn} onClick={handleGoogleLogin}>{accessToken ? "✓ מחובר לחשבון גוגל" : "התחבר לחשבון גוגל"}</button>
            <p style={{...styles.statusText, color: accessToken ? '#10b981' : '#ef4444'}}>{syncStatus}</p>
            <input style={styles.input} placeholder="שם פעילות" value={customName} onChange={(e)=>setCustomName(e.target.value)} />
            <button style={styles.submitBtn} onClick={handleAddCustomActivity}>שלח ליומן ←</button>
          </div>
        )}

        {activeTab === 1 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🎯 מטרות לאימון הבא</h2>
            {sessions.length === 0 ? <p style={styles.emptyState}>אין נתונים.</p> : Object.keys(EXERCISE_CONFIG).map(exKey => {
              const last = sessions.find(s => s.exercises && s.exercises[exKey]);
              if (!last) return null;
              return <div key={exKey} style={styles.targetItem}>{EXERCISE_CONFIG[exKey].name}: {last.exercises[exKey].weight} ק"ג</div>;
            })}
          </div>
        )}

        {activeTab === 2 && (
          <div style={styles.card}>
            {!activeWorkflow ? (
              <>
                <h2 style={styles.cardTitle}>מה מפרקים היום?</h2>
                <button style={styles.bigSplitBtn} onClick={()=>setActiveWorkflow('PUSH')}>🔥 אימון PUSH</button>
                <button style={styles.bigSplitBtn} onClick={()=>setActiveWorkflow('PULL')}>🔮 אימון PULL</button>
              </>
            ) : (
              <>
                <h2 style={styles.cardTitle}>הוסף תרגילים ל-{activeWorkflow}</h2>
                <select style={styles.input} onChange={(e) => {/* לוגיקת בחירת תרגיל */}}>
                    {WORKFLOWS[activeWorkflow].map(k => <option key={k} value={k}>{EXERCISE_CONFIG[k].name}</option>)}
                </select>
                <input style={styles.input} placeholder="משקל" value={weightInput} onChange={e=>setWeightInput(e.target.value)}/>
                <input style={styles.input} placeholder="חזרות" value={repsInput} onChange={e=>setRepsInput(e.target.value)}/>
                <button style={styles.submitBtn} onClick={() => addExerciseToSession(WORKFLOWS[activeWorkflow][0])}>הוסף לסל</button>
                <button style={{...styles.submitBtn, backgroundColor:'#10b981'}} onClick={finishAndSaveWorkout}>סיום ושמירה מלאה</button>
              </>
            )}
          </div>
        )}

        {activeTab === 3 && (
          <div>{Object.keys(EXERCISE_CONFIG).map(key => sessions.some(s => s.exercises && s.exercises[key]) && <div key={key} style={styles.card}><h4 style={{margin:0}}>{EXERCISE_CONFIG[key].name}</h4><canvas id={`chart-${key}`}></canvas></div>)}</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { direction: 'rtl', fontFamily: 'sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh', padding: '20px 10px' },
  header: { maxWidth: 500, margin: '0 auto 20px auto', textAlign: 'center' },
  title: { color: '#1e40af', margin: 0, fontWeight: 800, fontSize: '2rem' },
  tabsNav: { display: 'flex', backgroundColor: '#fff', padding: 4, borderRadius: 12, border: '1px solid #cbd5e1', gap: 4 },
  tabBtn: { flex: 1, padding: '10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#64748b', fontWeight: 'bold' },
  activeTab: { backgroundColor: '#1e40af', color: '#fff' },
  mainContent: { maxWidth: 500, margin: '0 auto' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, border: '1px solid #cbd5e1' },
  cardTitle: { margin: '0 0 15px 0', fontSize: '1.2rem', color: '#1e40af', fontWeight: '700' },
  input: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', marginTop: 10, boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: 14, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', marginTop: 10 },
  bigSplitBtn: { width: '100%', padding: 20, fontSize: '1.15rem', fontWeight: 'bold', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 12, marginTop: 15, cursor: 'pointer' },
  googleBtn: { width: '100%', padding: 14, backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', color: '#1e40af' },
  statusText: { fontSize: '0.85rem', textAlign: 'center', marginTop: 8, fontWeight: 'bold' },
  emptyState: { textAlign: 'center', color: '#64748b', fontStyle: 'italic' },
  targetItem: { padding: '12px 0', borderBottom: '1px solid #f1f5f9' }
};

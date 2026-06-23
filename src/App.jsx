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
  const [sessions, setSessions] = useState(() => JSON.parse(localStorage.getItem('gym_sessions')) || []);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeWorkoutData, setActiveWorkoutData] = useState({});
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const chartRefs = useRef({});

  // מנגנון סוויפ למובייל
  const touchStart = useRef(0);
  const handleTouchStart = (e) => touchStart.current = e.touches[0].clientX;
  const handleTouchEnd = (e) => {
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (delta > 50 && activeTab < 3) setActiveTab(p => p + 1);
    else if (delta < -50 && activeTab > 0) setActiveTab(p => p - 1);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get("access_token");
    if (token) {
        setAccessToken(token);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const getLastPerf = (exKey) => [...sessions].reverse().find(s => s.exercises?.[exKey]);

  const handleNextStep = async () => {
    const key = WORKFLOWS[activeWorkflow][currentStepIndex];
    const updatedData = { ...activeWorkoutData, [key]: { weight: weightInput, reps: repsInput } };
    
    if (currentStepIndex < WORKFLOWS[activeWorkflow].length - 1) {
      setActiveWorkoutData(updatedData);
      setCurrentStepIndex(p => p + 1);
      setWeightInput(""); setRepsInput("");
    } else {
      const newSession = { id: Date.now(), split: activeWorkflow, date: new Date().toLocaleDateString('he-IL'), exercises: updatedData };
      const newList = [newSession, ...sessions];
      setSessions(newList);
      localStorage.setItem('gym_sessions', JSON.stringify(newList));
      
      if (accessToken) {
         let desc = "סיכום אימון:\n" + Object.entries(updatedData).map(([k, v]) => `${EXERCISE_CONFIG[k].name}: ${v.weight}kg x ${v.reps}`).join('\n');
         await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
           body: JSON.stringify({ summary: `💪 אימון ${activeWorkflow}`, description: desc, start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date(Date.now() + 3600000).toISOString() } })
         });
      }
      setActiveWorkflow(null);
      alert("האימון נשמר וסונכרן!");
    }
  };

  const buildCharts = () => {
    Object.keys(EXERCISE_CONFIG).forEach(key => {
      const dataPoints = sessions.filter(s => s.exercises?.[key]).map(s => s.exercises[key].weight).reverse();
      const canvas = document.getElementById(`chart-${key}`);
      if (canvas && dataPoints.length > 0) {
        if (chartRefs.current[key]) chartRefs.current[key].destroy();
        chartRefs.current[key] = new Chart(canvas.getContext('2d'), { type: 'line', data: { labels: dataPoints.map((_,i)=>i+1), datasets: [{ data: dataPoints, borderColor: '#1e40af' }] } });
      }
    });
  };

  useEffect(() => { if (activeTab === 3) buildCharts(); }, [activeTab, sessions]);

  return (
    <div style={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div style={styles.header}>
        <h1 style={styles.title}>TRACK & GAIN</h1>
        <div style={styles.tabsNav}>
            {['📅 יומן', '🎯 מטרות', '📝 אימון', '📊 גרפים'].map((t, i) => (
                <button key={i} style={{...styles.tabBtn, ...(activeTab===i?styles.activeTab:{})}} onClick={()=>setActiveTab(i)}>{t}</button>
            ))}
        </div>
      </div>
      
      <div style={styles.mainContent}>
        {activeTab === 0 && (
            <div style={styles.card}>
                <button style={styles.submitBtn} onClick={() => window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}&response_type=token&scope=${SCOPES}`}>התחבר לגוגל</button>
            </div>
        )}
        {activeTab === 1 && (
            <div style={styles.card}>
                {Object.keys(EXERCISE_CONFIG).map(k => (
                    <div key={k} style={{marginBottom:10}}><strong>{EXERCISE_CONFIG[k].name}:</strong> {getLastPerf(k)?.exercises[k].weight || 0} ק"ג</div>
                ))}
            </div>
        )}
        {activeTab === 2 && (
            <div style={styles.card}>
                {!activeWorkflow ? (
                    <>
                        <button style={styles.bigSplitBtn} onClick={()=>setActiveWorkflow('PUSH')}>PUSH</button>
                        <button style={styles.bigSplitBtn} onClick={()=>setActiveWorkflow('PULL')}>PULL</button>
                    </>
                ) : (
                    <>
                        <h3>{EXERCISE_CONFIG[WORKFLOWS[activeWorkflow][currentStepIndex]].name}</h3>
                        <p>שיא קודם: {getLastPerf(WORKFLOWS[activeWorkflow][currentStepIndex])?.exercises[WORKFLOWS[activeWorkflow][currentStepIndex]].weight || 0} ק"ג</p>
                        <input style={styles.input} placeholder="משקל" onChange={e=>setWeightInput(e.target.value)} />
                        <input style={styles.input} placeholder="חזרות" onChange={e=>setRepsInput(e.target.value)} />
                        <button style={styles.submitBtn} onClick={handleNextStep}>הבא</button>
                    </>
                )}
            </div>
        )}
        {activeTab === 3 && Object.keys(EXERCISE_CONFIG).map(k => <div key={k} style={styles.card}><canvas id={`chart-${k}`}></canvas></div>)}
      </div>
    </div>
  );
}

const styles = {
    container: { direction: 'rtl', fontFamily: 'sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh', padding: '10px' },
    header: { maxWidth: 500, margin: '0 auto' },
    title: { color: '#1e40af', textAlign: 'center' },
    tabsNav: { display: 'flex', gap: 5, marginBottom: 20 },
    tabBtn: { flex: 1, padding: 10, borderRadius: 8, border: 'none' },
    activeTab: { backgroundColor: '#1e40af', color: '#fff' },
    mainContent: { maxWidth: 500, margin: '0 auto' },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: 10, margin: '5px 0', borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' },
    submitBtn: { width: '100%', padding: 12, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
    bigSplitBtn: { width: '100%', padding: 20, marginBottom: 10, borderRadius: 12, border: '1px solid #ddd', cursor: 'pointer' }
};

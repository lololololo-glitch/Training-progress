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
  
  // תוספות שביקשת
  const [activitiesList, setActivitiesList] = useState([]);
  const [customName, setCustomName] = useState("");
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState("18:00");

  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [activeWorkoutData, setActiveWorkoutData] = useState({});
  const [currentExKey, setCurrentExKey] = useState("");

  const chartRefs = useRef({});
  const touchStart = useRef(0);

  // Swipe Logic
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
    }
  }, []);

  const createGoogleEvent = async (title, dateStr, timeStr) => {
    const startDateTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: title, start: { dateTime: startDateTime }, end: { dateTime: startDateTime } })
    });
  };

  const getTarget = (exKey) => {
    const history = sessions.filter(s => s.exercises && s.exercises[exKey]);
    if (history.length === 0) return "טרם בוצע";
    const last = history[0].exercises[exKey];
    const isBig = EXERCISE_CONFIG[exKey].isBig;
    return last.reps >= 10 
      ? `${(parseFloat(last.weight) + (isBig ? 2.5 : 1)).toFixed(1)} ק"ג x 8` 
      : `${last.weight} ק"ג x ${parseInt(last.reps) + 1}`;
  };

  return (
    <div style={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div style={styles.header}>
        <h1 style={styles.title}>TRACK & GAIN</h1>
        <div style={styles.tabsNav}>
            <button style={{...styles.tabBtn, ...(activeTab===0?styles.activeTab:{})}} onClick={()=>setActiveTab(0)}>📅 יומן</button>
            <button style={{...styles.tabBtn, ...(activeTab===1?styles.activeTab:{})}} onClick={()=>setActiveTab(1)}>🎯 מטרות</button>
            <button style={{...styles.tabBtn, ...(activeTab===2?styles.activeTab:{})}} onClick={()=>setActiveTab(2)}>📝 אימון</button>
            <button style={{...styles.tabBtn, ...(activeTab===3?styles.activeTab:{})}} onClick={()=>setActiveTab(3)}>📊 גרפים</button>
        </div>
      </div>

      <div style={styles.mainContent}>
        {activeTab === 0 && (
          <div style={styles.card}>
            <input style={styles.input} placeholder="שם פעילות" value={customName} onChange={(e)=>setCustomName(e.target.value)} />
            <input style={styles.input} type="date" value={customDate} onChange={(e)=>setCustomDate(e.target.value)} />
            <input style={styles.input} type="time" value={customTime} onChange={(e)=>setCustomTime(e.target.value)} />
            <button style={styles.submitBtn} onClick={() => {setActivitiesList([...activitiesList, {name:customName, date:customDate, time:customTime}]); setCustomName("")}}>הוסף לרשימה +</button>
            
            <div style={{marginTop: 15}}>
              {activitiesList.map((a, i) => <div key={i}>{a.date} {a.time} - {a.name}</div>)}
            </div>
            {activitiesList.length > 0 && <button style={{...styles.submitBtn, backgroundColor:'#10b981'}} onClick={async () => {for(let a of activitiesList) await createGoogleEvent(a.name, a.date, a.time); setActivitiesList([]);}}>סנכרן את הכל</button>}
          </div>
        )}

        {activeTab === 1 && (
          <div style={styles.card}>
            {Object.keys(EXERCISE_CONFIG).map(k => <div key={k}>{EXERCISE_CONFIG[k].name}: {getTarget(k)}</div>)}
          </div>
        )}

        {activeTab === 2 && (
          <div style={styles.card}>
             {!activeWorkflow ? (
               <>
                 <button style={styles.bigSplitBtn} onClick={()=>{setActiveWorkflow('PUSH'); setCurrentExKey(WORKFLOWS.PUSH[0])}}>אימון PUSH</button>
                 <button style={styles.bigSplitBtn} onClick={()=>{setActiveWorkflow('PULL'); setCurrentExKey(WORKFLOWS.PULL[0])}}>אימון PULL</button>
               </>
             ) : (
               <>
                 <select style={styles.input} onChange={e => setCurrentExKey(e.target.value)}>
                    {WORKFLOWS[activeWorkflow].map(k => <option key={k} value={k}>{EXERCISE_CONFIG[k].name}</option>)}
                 </select>
                 <input style={styles.input} placeholder="משקל" value={weightInput} onChange={e=>setWeightInput(e.target.value)}/>
                 <input style={styles.input} placeholder="חזרות" value={repsInput} onChange={e=>setRepsInput(e.target.value)}/>
                 <button style={styles.submitBtn} onClick={() => setActiveWorkoutData({...activeWorkoutData, [currentExKey]: {weight: weightInput, reps: repsInput}})}>הוסף לסל</button>
                 <button style={{...styles.submitBtn, backgroundColor:'#10b981'}} onClick={() => {const s = {exercises: activeWorkoutData}; setSessions([s, ...sessions]); localStorage.setItem('gym_sessions', JSON.stringify([s, ...sessions])); setActiveWorkflow(null); setActiveWorkoutData({});}}>שמור ושדר</button>
               </>
             )}
          </div>
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
  tabBtn: { flex: 1, padding: '10px 2px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#64748b', fontWeight: 'bold' },
  activeTab: { backgroundColor: '#1e40af', color: '#fff' },
  mainContent: { maxWidth: 500, margin: '0 auto' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, border: '1px solid #cbd5e1' },
  input: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', marginTop: 10, boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: 14, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', marginTop: 10 },
  bigSplitBtn: { width: '100%', padding: 20, fontSize: '1.15rem', fontWeight: 'bold', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 12, marginTop: 15, cursor: 'pointer', textAlign: 'right', color: '#1e40af' }
};

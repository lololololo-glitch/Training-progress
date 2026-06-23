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

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [accessToken, setAccessToken] = useState(null);
  const [sessions, setSessions] = useState(JSON.parse(localStorage.getItem('gym_sessions')) || []);
  
  // Tab 0: Activities List
  const [activityList, setActivityList] = useState([]);
  const [customName, setCustomName] = useState("");
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState("18:00");

  // Tab 2: Workouts
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [tempWorkout, setTempWorkout] = useState({});
  const [currentExKey, setCurrentExKey] = useState(WORKFLOWS.PUSH[0]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

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
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get("access_token");
    if (token) setAccessToken(token);
  }, []);

  const syncActivities = async () => {
    for (let act of activityList) {
        const start = new Date(`${act.date}T${act.time}:00`).toISOString();
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: act.name, start: { dateTime: start }, end: { dateTime: start } })
        });
    }
    setActivityList([]);
    alert("הכל סונכרן!");
  };

  const getTarget = (exKey) => {
    const history = sessions.filter(s => s.exercises && s.exercises[exKey]);
    if (history.length === 0) return "טרם בוצע";
    const last = history[0].exercises[exKey];
    return last.reps >= 10 ? `${(parseFloat(last.weight) + 2.5).toFixed(1)}kg x 8` : `${last.weight}kg x ${parseInt(last.reps) + 1}`;
  };

  return (
    <div style={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div style={styles.tabsNav}>
        {['📅 יומן', '🎯 מטרות', '📝 אימון', '📊 גרפים'].map((t, i) => (
          <button key={i} style={{...styles.tabBtn, ...(activeTab===i?styles.activeTab:{})}} onClick={()=>setActiveTab(i)}>{t}</button>
        ))}
      </div>

      <div style={styles.mainContent}>
        {activeTab === 0 && (
          <div style={styles.card}>
            <h3>הוסף פעילויות ללו״ז:</h3>
            <input style={styles.input} placeholder="שם פעילות" value={customName} onChange={e=>setCustomName(e.target.value)} />
            <input style={styles.input} type="date" value={customDate} onChange={e=>setCustomDate(e.target.value)} />
            <input style={styles.input} type="time" value={customTime} onChange={e=>setCustomTime(e.target.value)} />
            <button style={styles.submitBtn} onClick={() => {setActivityList([...activityList, {name:customName, date:customDate, time:customTime}]); setCustomName("")}}>הוסף לרשימה +</button>
            
            <div style={styles.listArea}>
              {activityList.map((a, i) => <div key={i} style={styles.item}>{a.date} | {a.time} | <b>{a.name}</b></div>)}
            </div>
            {activityList.length > 0 && <button style={{...styles.submitBtn, background:'#10b981'}} onClick={syncActivities}>סנכרן את כל {activityList.length} הפעילויות</button>}
          </div>
        )}

        {activeTab === 1 && (
          <div style={styles.card}>
            {Object.keys(EXERCISE_CONFIG).map(k => <div key={k} style={styles.item}>{EXERCISE_CONFIG[k].name}: <span style={{color:'blue'}}>{getTarget(k)}</span></div>)}
          </div>
        )}

        {activeTab === 2 && (
          <div style={styles.card}>
            {!activeWorkflow ? (
              <>
                <button style={styles.bigBtn} onClick={() => setActiveWorkflow('PUSH')}>אימון PUSH</button>
                <button style={styles.bigBtn} onClick={() => setActiveWorkflow('PULL')}>אימון PULL</button>
              </>
            ) : (
              <>
                <select style={styles.input} onChange={e => setCurrentExKey(e.target.value)}>
                  {WORKFLOWS[activeWorkflow].map(k => <option key={k} value={k}>{EXERCISE_CONFIG[k].name}</option>)}
                </select>
                <input style={styles.input} placeholder="משקל" onChange={e => setWeight(e.target.value)} />
                <input style={styles.input} placeholder="חזרות" onChange={e => setReps(e.target.value)} />
                <button style={styles.submitBtn} onClick={() => setTempWorkout({...tempWorkout, [currentExKey]: {weight, reps}})}>הוסף תרגיל לסל</button>
                <div style={styles.listArea}>{Object.keys(tempWorkout).map(k => <div key={k}>{EXERCISE_CONFIG[k].name}: {tempWorkout[k].weight}kg</div>)}</div>
                <button style={{...styles.submitBtn, background:'green'}} onClick={() => { const newS = {exercises:tempWorkout}; setSessions([newS, ...sessions]); localStorage.setItem('gym_sessions', JSON.stringify([newS, ...sessions])); setTempWorkout({}); setActiveWorkflow(null); }}>שמור אימון</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { direction: 'rtl', padding: '20px', fontFamily: 'sans-serif' },
  tabsNav: { display: 'flex', gap: '5px' },
  tabBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#e2e8f0' },
  activeTab: { background: '#1e40af', color: '#fff' },
  card: { border: '1px solid #cbd5e1', padding: '15px', borderRadius: '16px', marginTop: '10px' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', marginTop: '10px', background: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none' },
  bigBtn: { width: '100%', padding: '20px', marginTop: '10px', borderRadius: '12px' },
  listArea: { marginTop: '15px', borderTop: '1px solid #ddd', paddingTop: '10px' },
  item: { padding: '5px 0', borderBottom: '1px solid #eee' }
};

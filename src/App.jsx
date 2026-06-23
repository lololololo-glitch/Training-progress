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

  // לוגיקת אימון משודרגת
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [tempWorkout, setTempWorkout] = useState([]);
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [currentEx, setCurrentEx] = useState('flat');

  // מנגנון גלילה
  const touchStart = useRef(0);
  const handleTouchStart = (e) => touchStart.current = e.touches[0].clientX;
  const handleTouchEnd = (e) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeTab < 3) setActiveTab(activeTab + 1);
      else if (diff < 0 && activeTab > 0) setActiveTab(activeTab - 1);
    }
  };

  const chartRefs = useRef({});

  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('gym_sessions')) || [];
    setSessions(savedSessions);
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get("access_token");
    if (token) {
      setAccessToken(token);
      setSyncStatus("מחובר ומסונכרן! 🎉");
    }
  }, []);

  const addExercise = () => {
    setTempWorkout([...tempWorkout, { key: currentEx, weight: weightInput, reps: repsInput }]);
    setWeightInput(""); setRepsInput("");
  };

  const finalizeWorkout = async () => {
    const exercisesObj = tempWorkout.reduce((acc, ex) => ({ ...acc, [ex.key]: { weight: ex.weight, reps: ex.reps } }), {});
    const newSession = { id: Date.now(), split: activeWorkflow, date: new Date().toLocaleDateString('he-IL'), exercises: exercisesObj };
    const newSessionsList = [newSession, ...sessions];
    setSessions(newSessionsList);
    localStorage.setItem('gym_sessions', JSON.stringify(newSessionsList));
    setTempWorkout([]); setActiveWorkflow(null);
    alert("האימון נשמר!");
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
        {/* טאבים אחרים נשארים ללא שינוי... */}
        {activeTab === 2 && (
          <div style={styles.card}>
            {!activeWorkflow ? (
              <>
                <button style={styles.bigSplitBtn} onClick={() => setActiveWorkflow('PUSH')}>התחל אימון PUSH</button>
                <button style={styles.bigSplitBtn} onClick={() => setActiveWorkflow('PULL')}>התחל אימון PULL</button>
              </>
            ) : (
              <>
                <select style={styles.input} onChange={(e) => setCurrentEx(e.target.value)}>
                  {WORKFLOWS[activeWorkflow].map(k => <option key={k} value={k}>{EXERCISE_CONFIG[k].name}</option>)}
                </select>
                <input style={styles.input} placeholder="משקל" value={weightInput} onChange={e => setWeightInput(e.target.value)}/>
                <input style={styles.input} placeholder="חזרות" value={repsInput} onChange={e => setRepsInput(e.target.value)}/>
                <button style={styles.submitBtn} onClick={addExercise}>הוסף תרגיל לסל</button>
                <div style={{margin: '10px 0'}}>
                  {tempWorkout.map((ex, i) => <div key={i}>{EXERCISE_CONFIG[ex.key].name}: {ex.weight}kg x {ex.reps}</div>)}
                </div>
                <button style={{...styles.submitBtn, backgroundColor: '#10b981'}} onClick={finalizeWorkout}>סיים ושמור הכל</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// שאר ה-Styles נשארים בדיוק כפי ששלחת בקוד שלך
const styles = {
  container: { direction: 'rtl', fontFamily: 'sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh', padding: '20px 10px' },
  header: { maxWidth: 500, margin: '0 auto 20px auto', textAlign: 'center' },
  title: { color: '#1e40af', margin: 0, fontWeight: 800, fontSize: '2rem' },
  tabsNav: { display: 'flex', backgroundColor: '#fff', padding: 4, borderRadius: 12, border: '1px solid #cbd5e1', gap: 4 },
  tabBtn: { flex: 1, padding: '10px 2px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#64748b', fontWeight: 'bold' },
  activeTab: { backgroundColor: '#1e40af', color: '#fff' },
  mainContent: { maxWidth: 500, margin: '0 auto' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  input: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: 10 },
  submitBtn: { width: '100%', padding: 14, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', marginTop: 10 },
  bigSplitBtn: { width: '100%', padding: 20, fontSize: '1.15rem', fontWeight: 'bold', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 12, cursor: 'pointer', marginTop: 15 }
};

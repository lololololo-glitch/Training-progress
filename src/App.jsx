import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// --- הגדרת קונפיגורציה עשירה ---
const GOOGLE_CLIENT_ID = "348003759546-rl3l7bpekqct6gve9vmsupm2qsbcvpg4.apps.googleusercontent.com";

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState(() => JSON.parse(localStorage.getItem('pro_gym_data') || '[]'));
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [currentExercise, setCurrentExercise] = useState({ name: '', weight: '', reps: '', sets: '' });
  const [tempWorkout, setTempWorkout] = useState([]);

  // --- פונקציות ניהול נתונים וסנכרון ---
  const saveWorkoutToLocal = () => {
    const newSession = { id: Date.now(), date: new Date().toLocaleDateString('he-IL'), exercises: tempWorkout };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    localStorage.setItem('pro_gym_data', JSON.stringify(updated));
    setTempWorkout([]);
    setActiveWorkout(null);
    alert("🔥 האימון נשמר בהצלחה!");
  };

  const syncWithGoogle = () => {
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}&response_type=token&scope=https://www.googleapis.com/auth/calendar.events`;
  };

  // --- מנוע חישוב מטרות (Progressive Overload) ---
  const calculateNextGoal = (name) => {
    const history = sessions.flatMap(s => s.exercises).filter(ex => ex.name === name);
    if (history.length === 0) return 20;
    return parseFloat(history[0].weight) + 2.5;
  };

  // --- ממשק משתמש וגלילה ---
  const touchStart = useRef(0);
  const handleTouchStart = (e) => (touchStart.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeTab < 3) setActiveTab(activeTab + 1);
      else if (diff < 0 && activeTab > 0) setActiveTab(activeTab - 1);
    }
  };

  return (
    <div style={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <header style={styles.header}>
        <h1 style={styles.title}>TRACK & GAIN PRO</h1>
        <div style={styles.tabBar}>
          {['📅 יומן', '🎯 מטרות', '📝 אימון', '📊 גרפים'].map((t, i) => (
            <button key={i} style={activeTab === i ? styles.activeTab : styles.tab} onClick={() => setActiveTab(i)}>{t}</button>
          ))}
        </div>
      </header>

      <main style={styles.main}>
        {/* עמוד אימון - הוספת תרגילים דינמית */}
        {activeTab === 2 && (
          <div style={styles.card}>
            {!activeWorkout ? (
              <button style={styles.button} onClick={() => setActiveWorkout('NEW_SESSION')}>התחל אימון חדש</button>
            ) : (
              <div>
                <input style={styles.input} placeholder="שם תרגיל" onChange={e => setCurrentExercise({...currentExercise, name: e.target.value})} />
                <input style={styles.input} placeholder="משקל" type="number" onChange={e => setCurrentExercise({...currentExercise, weight: e.target.value})} />
                <input style={styles.input} placeholder="חזרות" type="number" onChange={e => setCurrentExercise({...currentExercise, reps: e.target.value})} />
                <input style={styles.input} placeholder="סטים" type="number" onChange={e => setCurrentExercise({...currentExercise, sets: e.target.value})} />
                <button style={styles.button} onClick={() => { setTempWorkout([...tempWorkout, currentExercise]); setCurrentExercise({name:'', weight:'', reps:'', sets:''}) }}>הוסף תרגיל לאימון</button>
                <button style={{...styles.button, background: '#10b981'}} onClick={saveWorkoutToLocal}>סיים ושמור</button>
              </div>
            )}
            <div style={{marginTop: '20px'}}>
              {tempWorkout.map((ex, i) => <div key={i} style={styles.logItem}>{ex.name}: {ex.weight}kg x {ex.reps} ({ex.sets} סטים)</div>)}
            </div>
          </div>
        )}

        {/* עמוד מטרות - חישוב אוטומטי */}
        {activeTab === 1 && (
          <div style={styles.card}>
            {['בנץ פרס', 'פולי עליון', 'סקווט'].map(name => (
              <div key={name} style={styles.goalRow}>
                <span>{name}</span>
                <span style={styles.goalValue}>{calculateNextGoal(name)} ק"ג</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// --- עיצוב מקצועי ---
const styles = {
  container: { direction: 'rtl', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '10px' },
  header: { backgroundColor: '#1e40af', padding: '20px', borderRadius: '15px', color: 'white', textAlign: 'center', marginBottom: '20px' },
  title: { fontSize: '1.5rem', marginBottom: '15px' },
  tabBar: { display: 'flex', gap: '5px' },
  tab: { flex: 1, padding: '10px', background: 'transparent', color: 'white', border: '1px solid #60a5fa', borderRadius: '8px', cursor: 'pointer' },
  activeTab: { flex: 1, padding: '10px', background: 'white', color: '#1e40af', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  main: { maxWidth: '500px', margin: '0 auto' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  button: { width: '100%', padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', marginTop: '10px', cursor: 'pointer' },
  input: { width: '100%', padding: '12px', margin: '5px 0', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box' },
  goalRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #eee' },
  goalValue: { color: '#059669', fontWeight: 'bold' },
  logItem: { padding: '8px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }
};

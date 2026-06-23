import React, { useState, useEffect } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState(JSON.parse(localStorage.getItem('gym_sessions')) || []);
  const [tempWorkout, setTempWorkout] = useState(Array(6).fill({ name: '', sets: '', reps: '', weight: '' }));

  const saveWorkout = () => {
    const newSessions = [tempWorkout, ...sessions];
    setSessions(newSessions);
    localStorage.setItem('gym_sessions', JSON.stringify(newSessions));
    setTempWorkout(Array(6).fill({ name: '', sets: '', reps: '', weight: '' }));
    alert("האימון נשמר!");
  };

  const getTarget = (exName) => {
    const lastSession = sessions.find(s => s.find(row => row.name === exName));
    if (!lastSession) return "טרם בוצע";
    const last = lastSession.find(row => row.name === exName);
    return `${parseFloat(last.weight) + 2.5} ק"ג x ${last.reps}`;
  };

  return (
    <div style={{ direction: 'rtl', backgroundColor: '#050505', minHeight: '100vh', color: '#fff', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#3b82f6' }}>TRACK & GAIN</h1>
      
      {/* תפריט ניווט */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#111', padding: '5px', borderRadius: '12px' }}>
        {['📅 יומן', '🎯 מטרות', '📝 אימון', '📊 גרפים'].map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{ flex: 1, padding: '12px', background: activeTab === i ? '#3b82f6' : 'transparent', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}>{t}</button>
        ))}
      </div>

      {/* אזור האימון */}
      {activeTab === 2 && (
        <div style={{ background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #333' }}>
          <h2 style={{ marginBottom: '20px' }}>אימון כוח</h2>
          {tempWorkout.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '5px', marginBottom: '10px' }}>
              <input placeholder="תרגיל" value={row.name} onChange={(e) => { const n = [...tempWorkout]; n[i].name = e.target.value; setTempWorkout(n); }} style={styles.input} />
              <input placeholder="סטים" value={row.sets} onChange={(e) => { const n = [...tempWorkout]; n[i].sets = e.target.value; setTempWorkout(n); }} style={styles.input} />
              <input placeholder="חזרות" value={row.reps} onChange={(e) => { const n = [...tempWorkout]; n[i].reps = e.target.value; setTempWorkout(n); }} style={styles.input} />
              <input placeholder="משקל" value={row.weight} onChange={(e) => { const n = [...tempWorkout]; n[i].weight = e.target.value; setTempWorkout(n); }} style={styles.input} />
            </div>
          ))}
          <button onClick={saveWorkout} style={styles.bigButton}>שמור אימון</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff' },
  bigButton: { width: '100%', padding: '16px', background: '#10b981', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', marginTop: '20px' }
};

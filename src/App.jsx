import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// --- קונפיגורציה מקצועית של תרגילים ---
const EXERCISES = {
  PUSH: [
    { id: 'flat', name: "בנץ' פרס רגיל", type: 'big' },
    { id: 'incline', name: "שיפוע חיובי משקולות", type: 'big' },
    { id: 'ropePush', name: "פשיטת מרפקים חבל", type: 'small' },
    { id: 'skullCrush', name: "Skull Crusher מוט", type: 'small' }
  ],
  PULL: [
    { id: 'latPull', name: "פולי עליון רחב", type: 'big' },
    { id: 'dbRow', name: "חתירה עם משקולת", type: 'big' },
    { id: 'dbCurl', name: "כפיפת מרפקים משקולות", type: 'small' },
    { id: 'bbCurl', name: "יד קדמית מוט אולימפי", type: 'small' }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState(() => JSON.parse(localStorage.getItem('gym_pro_data') || '[]'));
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ weight: '', reps: '' });

  // מנוע מגע להחלקה (Swipe)
  const touchStart = useRef(0);
  const handleTouchStart = (e) => (touchStart.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 80) {
      if (delta > 0 && activeTab < 3) setActiveTab(prev => prev + 1);
      else if (delta < 0 && activeTab > 0) setActiveTab(prev => prev - 1);
    }
  };

  // לוגיקה לחישוב מטרות (Progressive Overload)
  const getGoal = (exId) => {
    const history = sessions.filter(s => s.exercises[exId]);
    if (history.length === 0) return 10;
    const last = history[0].exercises[exId];
    return parseFloat(last.weight) + 2.5;
  };

  // רינדור גרפים דינמי
  useEffect(() => {
    if (activeTab === 3) {
      Object.keys(EXERCISES).forEach(cat => {
        EXERCISES[cat].forEach(ex => {
          const canvas = document.getElementById(`chart-${ex.id}`);
          if (canvas) {
            const data = sessions.filter(s => s.exercises[ex.id]).map(s => s.exercises[ex.id].weight).reverse();
            new Chart(canvas.getContext('2d'), {
              type: 'line',
              data: { labels: data.map((_, i) => i + 1), datasets: [{ label: ex.name, data, borderColor: '#3b82f6', tension: 0.4 }] },
              options: { responsive: true, plugins: { legend: { labels: { color: '#fff' } } } }
            });
          }
        });
      });
    }
  }, [activeTab, sessions]);

  return (
    <div style={styles.container} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <header style={styles.header}>
        <h1 style={styles.title}>PRO TRACKER</h1>
        <div style={styles.tabContainer}>
          {['יומן', 'מטרות', 'אימון', 'גרפים'].map((t, i) => (
            <button key={i} style={{...styles.tabBtn, ...(activeTab === i ? styles.activeTab : {})}} onClick={() => setActiveTab(i)}>{t}</button>
          ))}
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === 1 && (
          <div style={styles.card}>
            <h2>מטרות לאימון הבא</h2>
            {Object.values(EXERCISES).flat().map(ex => (
              <div key={ex.id} style={styles.goalItem}>
                <span>{ex.name}</span>
                <span style={styles.goalValue}>{getGoal(ex.id)} ק"ג</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 2 && (
          <div style={styles.card}>
            {!activeWorkout ? (
              <>
                <h2>בחר אימון</h2>
                <button style={styles.bigBtn} onClick={() => setActiveWorkout({ type: 'PUSH', exercises: {} })}>PUSH</button>
                <button style={styles.bigBtn} onClick={() => setActiveWorkout({ type: 'PULL', exercises: {} })}>PULL</button>
              </>
            ) : (
              <div>
                <h3>{EXERCISES[activeWorkout.type][step].name}</h3>
                <input style={styles.input} placeholder="משקל" type="number" onChange={e => setFormData({...formData, weight: e.target.value})} />
                <input style={styles.input} placeholder="חזרות" type="number" onChange={e => setFormData({...formData, reps: e.target.value})} />
                <button style={styles.nextBtn} onClick={() => {
                  const currentEx = EXERCISES[activeWorkout.type][step];
                  activeWorkout.exercises[currentEx.id] = formData;
                  if (step < EXERCISES[activeWorkout.type].length - 1) setStep(step + 1);
                  else {
                    setSessions([activeWorkout, ...sessions]);
                    localStorage.setItem('gym_pro_data', JSON.stringify([activeWorkout, ...sessions]));
                    setActiveWorkout(null); setStep(0);
                  }
                }}>שמור והמשך</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { direction: 'rtl', minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '20px' },
  header: { maxWidth: '500px', margin: '0 auto' },
  title: { textAlign: 'center', color: '#60a5fa' },
  tabContainer: { display: 'flex', gap: '5px' },
  tabBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#1e293b', color: '#fff' },
  activeTab: { background: '#60a5fa' },
  main: { maxWidth: '500px', margin: '20px auto' },
  card: { background: '#1e293b', padding: '20px', borderRadius: '20px' },
  goalItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' },
  goalValue: { color: '#10b981', fontWeight: 'bold' },
  input: { width: '100%', padding: '15px', margin: '10px 0', borderRadius: '10px', background: '#0f172a', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' },
  bigBtn: { width: '100%', padding: '20px', margin: '10px 0', borderRadius: '15px', background: '#3b82f6', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' },
  nextBtn: { width: '100%', padding: '15px', borderRadius: '10px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 'bold' }
};

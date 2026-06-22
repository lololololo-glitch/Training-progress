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

// !!! מחק את הטקסט בגרשיים והדבק כאן את ה-Client ID שלך !!!
const GOOGLE_CLIENT_ID = "348003759546-j7f6ogvj8krv5s36dc9omj8qpbo8u1v3.apps.googleusercontent.com";
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [activeWorkoutData, setActiveWorkoutData] = useState({});

  const chartRefs = useRef({});

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
    if (activeTab === 3 && sessions.length > 0) {
      buildCharts();
    }
  }, [activeTab, sessions]);

  const handleGoogleLogin = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authUrl;
  };

  const createGoogleEvent = async (title, description, dateStr, timeStr) => {
    if (!accessToken) {
      alert("היומן אינו מחובר!");
      return false;
    }
    const startDateTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    const endDateTime = new Date(new Date(`${dateStr}T${timeStr}:00`).getTime() + 60 * 60 * 1000).toISOString();

    const event = {
      summary: title,
      description: description,
      start: { dateTime: startDateTime, timeZone: 'Asia/Jerusalem' },
      end: { dateTime: endDateTime, timeZone: 'Asia/Jerusalem' }
    };

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      return response.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleAddCustomActivity = async () => {
    if (!customName) return alert("אנא הזן את שם הפעילות!");
    const success = await createGoogleEvent(customName, "פעילות חופשית מ-Track & Gain 🏃‍♂️", customDate, customTime);
    if (success) {
      alert(`הפעילות "${customName}" סונכרנה בהצלחה ליומן גוגל!`);
      setCustomName("");
    } else {
      alert("שגיאה בסנכרון.");
    }
  };

  const startWorkout = (type) => {
    setActiveWorkflow(type);
    setCurrentStepIndex(0);
    setActiveWorkoutData({});
    setWeightInput("");
    setRepsInput("");
  };

  const handleNextStep = async () => {
    const currentExerciseKey = WORKFLOWS[activeWorkflow][currentStepIndex];
    const weight = parseFloat(weightInput) || 0;
    const reps = parseInt(repsInput) || 0;

    const updatedData = { ...activeWorkoutData };
    if (weight && reps) {
      updatedData[currentExerciseKey] = { weight, reps };
      setActiveWorkoutData(updatedData);
    }

    const totalSteps = WORKFLOWS[activeWorkflow].length;
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      const nextKey = WORKFLOWS[activeWorkflow][currentStepIndex + 1];
      setWeightInput(updatedData[nextKey]?.weight || "");
      setRepsInput(updatedData[nextKey]?.reps || "");
    } else {
      const rawDate = new Date();
      const isoDate = rawDate.toISOString().split('T')[0];
      const timeStr = rawDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

      const newSession = {
        id: Date.now(),
        split: activeWorkflow,
        date: rawDate.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        time: timeStr,
        exercises: updatedData
      };

      const newSessionsList = [newSession, ...sessions];
      setSessions(newSessionsList);
      localStorage.setItem('gym_sessions', JSON.stringify(newSessionsList));

      if (accessToken) {
        let summaryDesc = `תקציר אימון משקלים:\n`;
        Object.keys(updatedData).forEach(k => {
          summaryDesc += `- ${EXERCISE_CONFIG[k].name}: ${updatedData[k].weight} ק"ג x ${updatedData[k].reps}\n`;
        });
        await createGoogleEvent(`💪 אימון ${activeWorkflow} (Track & Gain)`, summaryDesc, isoDate, timeStr);
        alert("האימון נשמר וסונכרן לגוגל קאלנדר! 🔥");
      } else {
        alert("האימון נשמר מקומית בדפדפן.");
      }
      setActiveWorkflow(null);
    }
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
        chartRefs.current[key] = new Chart(canvas.getContext('2d'), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              data: dataPoints,
              borderColor: '#1e40af',
              backgroundColor: 'rgba(30, 64, 175, 0.05)',
              borderWidth: 3,
              tension: 0.15
            }]
          },
          options: { responsive: true, plugins: { legend: { display: false } } }
        });
      }
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>TRACK & GAIN</h1>
        <p style={styles.subtitle}>ריאקט + סנכרון יומן מלא וגרפים</p>
        <div style={styles.tabsNav}>
          <button style={{...styles.tabBtn, ...(activeTab===0?styles.activeTab:{})}} onClick={()=>setActiveTab(0)}>📅 יומן גוגל</button>
          <button style={{...styles.tabBtn, ...(activeTab===1?styles.activeTab:{})}} onClick={()=>setActiveTab(1)}>🎯 מטרות</button>
          <button style={{...styles.tabBtn, ...(activeTab===2?styles.activeTab:{})}} onClick={()=>setActiveTab(2)}>📝 אימון אקטיבי</button>
          <button style={{...styles.tabBtn, ...(activeTab===3?styles.activeTab:{})}} onClick={()=>setActiveTab(3)}>📊 אנליטיקה</button>
        </div>
      </div>

      <div style={styles.mainContent}>
        {activeTab === 0 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🔗 חיבור ישיר ומאובטח ליומן גוגל</h2>
            <button style={styles.googleBtn} onClick={handleGoogleLogin}>
              <span>{accessToken ? "✓ מחובר לחשבון גוגל" : "התחבר לחשבון גוגל (חינם לחלוטין)"}</span>
            </button>
            <p style={{...styles.statusText, color: accessToken ? '#10b981' : '#ef4444'}}>{syncStatus}</p>

            <div style={{marginTop: 30, paddingTop: 20, borderTop: '1px solid #e2e8f0'}}>
              <h3 style={styles.sectionTitle}>🏃‍♂️ הוספת פעילות חופשית</h3>
              <input style={styles.input} type="text" placeholder="למשל: ריצת נפח 5 ק״מ 🏃‍♂️" value={customName} onChange={(e)=>setCustomName(e.target.value)} />
              <div style={{display:'flex', gap: 10, marginTop: 10}}>
                <input style={styles.input} type="date" value={customDate} onChange={(e)=>setCustomDate(e.target.value)} />
                <input style={styles.input} type="time" value={customTime} onChange={(e)=>setCustomTime(e.target.value)} />
              </div>
              <button style={styles.submitBtn} onClick={handleAddCustomActivity}>שלח ישירות ליומן שלי ←</button>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🎯 מטרות לאימון הבא שלך</h2>
            {sessions.length === 0 ? (
              <p style={styles.emptyState}>אין אימונים מתועדים. בצע אימון כדי לחשב מטרות!</p>
            ) : (
              Object.keys(EXERCISE_CONFIG).map(exKey => {
                const config = EXERCISE_CONFIG[exKey];
                const lastSession = sessions.find(s => s.exercises && s.exercises[exKey]);
                if (!lastSession) return null;
                const lastData = lastSession.exercises[exKey];
                let targetWeight = lastData.weight;
                let targetReps = lastData.reps;
                
                if (lastData.reps >= (config.isBig ? 8 : 10)) {
                  targetWeight += config.isBig ? 2.5 : 1;
                  targetReps = config.isBig ? 6 : 8;
                } else {
                  targetReps += 1;
                }

                return (
                  <div key={exKey} style={styles.targetItem}>
                    <div style={{fontWeight:'bold'}}>{config.name}</div>
                    <div>יעד הבא: <span style={{color:'#1e40af', fontWeight:'bold'}}>{targetWeight} ק"ג</span> × {targetReps} חזרות</div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div>
            {!activeWorkflow ? (
              <div style={styles.card}>
                <h2 style={{...styles.cardTitle, textAlign:'center'}}>מה מפרקים היום?</h2>
                <button style={{...styles.bigSplitBtn, borderRight:'6px solid #3b82f6'}} onClick={()=>startWorkout('PUSH')}>🔥 אימון PUSH (דחיפה)</button>
                <button style={{...styles.bigSplitBtn, borderRight:'6px solid #7c3aed', marginTop: 15}} onClick={()=>startWorkout('PULL')}>🔮 אימון PULL (משיכה)</button>
              </div>
            ) : (
              <div style={styles.card}>
                <span style={{fontSize:'0.8rem', color:'#64748b'}}>תרגיל {currentStepIndex+1} מתוך {WORKFLOWS[activeWorkflow].length}</span>
                <h2 style={styles.cardTitle}>{EXERCISE_CONFIG[WORKFLOWS[activeWorkflow][currentStepIndex]].name}</h2>
                <div style={{display:'flex', flexDirection:'column', gap: 15, margin: '20px 0'}}>
                  <div>
                    <label style={styles.label}>משקל (ק"ג)</label>
                    <input style={styles.input} type="number" value={weightInput} onChange={(e)=>setWeightInput(e.target.value)} inputMode="decimal"/>
                  </div>
                  <div>
                    <label style={styles.label}>חזרות</label>
                    <input style={styles.input} type="number" value={repsInput} onChange={(e)=>setRepsInput(e.target.value)} inputMode="numeric"/>
                  </div>
                </div>
                <div style={{display:'flex', gap: 10}}>
                  <button style={{...styles.submitBtn, flex:2}} onClick={handleNextStep}>
                    {currentStepIndex === WORKFLOWS[activeWorkflow].length - 1 ? "🏆 סיים וסנכרן" : "התרגיל הבא ←"}
                  </button>
                  <button style={{...styles.submitBtn, backgroundColor:'#e2e8f0', color:'#475569', flex:1}} onClick={()=>setActiveWorkflow(null)}>ביטול</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 3 && (
          <div>
            <h3 style={styles.sectionTitle}>📊 גרפי התקדמות</h3>
            {sessions.length === 0 ? (
              <div style={styles.card}><p style={styles.emptyState}>אין מספיק נתונים.</p></div>
            ) : (
              Object.keys(EXERCISE_CONFIG).map(key => {
                if (!sessions.some(s => s.exercises && s.exercises[key])) return null;
                return (
                  <div key={key} style={{...styles.card, marginBottom: 15}}>
                    <h4 style={{margin: '0 0 10px 0', color:'#1e40af'}}>{EXERCISE_CONFIG[key].name}</h4>
                    <canvas id={`chart-${key}`}></canvas>
                  </div>
                );
              })
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
  subtitle: { color: '#64748b', margin: '5px 0 15px 0', fontSize: '0.85rem' },
  tabsNav: { display: 'flex', backgroundColor: '#fff', padding: 4, borderRadius: 12, border: '1px solid #cbd5e1', gap: 4 },
  tabBtn: { flex: 1, padding: '10px 2px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#64748b', fontWeight: 'bold', fontSize: '0.8rem' },
  activeTab: { backgroundColor: '#1e40af', color: '#fff' },
  mainContent: { maxWidth: 500, margin: '0 auto' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  cardTitle: { margin: '0 0 15px 0', fontSize: '1.2rem', color: '#1e40af', fontWeight: '700' },
  googleBtn: { width: '100%', padding: 14, backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', color: '#1e40af' },
  statusText: { fontSize: '0.85rem', textAlign: 'center', marginTop: 8, fontWeight: 'bold' },
  sectionTitle: { fontSize: '0.95rem', color: '#1e40af', margin: '15px 0 10px 0', fontWeight: 'bold' },
  input: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontWeight: 'bold', backgroundColor: '#f8fafc' },
  submitBtn: { width: '100%', padding: 14, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', marginTop: 10 },
  emptyState: { textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '20px 0' },
  targetItem: { padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  bigSplitBtn: { width: '100%', padding: 20, fontSize: '1.15rem', fontWeight: 'bold', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: 12, cursor: 'pointer', textAlign: 'right', color: '#1e40af' },
  label: { display: 'block', marginBottom: 6, fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }
};

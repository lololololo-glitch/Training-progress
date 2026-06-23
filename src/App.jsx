import React, { useState } from 'react';

export default function App() {
  const [tab, setTab] = useState(0); // שומר על איזה מסך אתה

  return (
    <div style={{ direction: 'rtl', backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* תפריט ניווט עליון */}
      <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
        {['יומן', 'מטרות', 'אימון', 'גרפים'].map((name, i) => (
          <button key={i} onClick={() => setTab(i)} 
            style={{ flex: 1, padding: '15px', background: tab === i ? '#3b82f6' : 'transparent', border: 'none', color: 'white' }}>
            {name}
          </button>
        ))}
      </div>

      {/* אזור תוכן */}
      <div style={{ padding: '20px' }}>
        {tab === 2 && (
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
            <h2>אימון PUSH</h2>
            {/* כאן יהיו 6 שורות התרגילים */}
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px', marginBottom: '10px' }}>
                <input placeholder="תרגיל" style={{ padding: '8px', borderRadius: '4px' }} />
                <input placeholder="סטים" style={{ padding: '8px' }} />
                <input placeholder="חזרות" style={{ padding: '8px' }} />
                <input placeholder="משקל" style={{ padding: '8px' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

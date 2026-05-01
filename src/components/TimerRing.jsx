export default function TimerRing({ pct, color, running, children }) {
  const r = 80, circ = 2 * Math.PI * r;
  return (
    <div style={{ position:"relative", width:200, height:200 }}>
      <svg width={200} height={200} style={{ transform:"rotate(-90deg)", ...(running ? { filter:`drop-shadow(0 0 14px ${color}55)` } : {}) }}>
        <circle cx={100} cy={100} r={r} fill="none" stroke={`${color}22`} strokeWidth={10}/>
        <circle cx={100} cy={100} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
          strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.5s ease" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        {children}
      </div>
    </div>
  );
}

export function FernSpiral({ color, size = 40, opacity = 0.18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity }}>
      <path d="M20 38 C20 38 20 20 20 20 C20 20 28 16 32 10 C28 14 20 14 20 14 C20 14 24 8 28 4 C22 8 20 10 20 10 C20 10 18 6 14 2 C18 6 20 10 20 10 C20 10 12 12 8 16 C14 14 20 14 20 14 C20 14 12 18 10 24 C14 20 20 20 20 20" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function SeedPod({ color, size = 28, opacity = 0.2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={{ opacity }}>
      <ellipse cx="14" cy="14" rx="6" ry="10" stroke={color} strokeWidth="1" fill={`${color}15`}/>
      <line x1="14" y1="4" x2="14" y2="24" stroke={color} strokeWidth="0.8" strokeDasharray="2 2"/>
      <ellipse cx="14" cy="14" rx="10" ry="6" stroke={color} strokeWidth="0.8" strokeDasharray="3 2"/>
    </svg>
  );
}

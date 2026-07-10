export const teams = [
  { id: 'mclaren', name: 'McLaren', color: '#ff8000', pace: 1.0 },
  { id: 'ferrari', name: 'Ferrari', color: '#dc0000', pace: 0.995 },
  { id: 'redbull', name: 'Red Bull', color: '#1e41ff', pace: 0.998 },
  { id: 'mercedes', name: 'Mercedes', color: '#00d2be', pace: 0.992 },
  { id: 'aston', name: 'Aston Martin', color: '#006f62', pace: 0.985 },
  { id: 'alpine', name: 'Alpine', color: '#ff87bc', pace: 0.979 },
  { id: 'williams', name: 'Williams', color: '#005aff', pace: 0.976 },
  { id: 'rb', name: 'Racing Bulls', color: '#6692ff', pace: 0.974 },
  { id: 'sauber', name: 'Kick Sauber', color: '#52e252', pace: 0.97 },
  { id: 'haas', name: 'Haas', color: '#ffffff', pace: 0.968 }
];

export function buildDrivers() {
  const drivers = [];
  teams.forEach((team, idx) => {
    drivers.push({ id: `${team.id}-1`, teamId: team.id, name: `${team.name} #1`, team, skill: 0.995 + (10 - idx) * 0.0015 });
    drivers.push({ id: `${team.id}-2`, teamId: team.id, name: `${team.name} #2`, team, skill: 0.992 + (10 - idx) * 0.0013 });
  });
  return drivers;
}

export const tracks = [
  {
    id: 'monza',
    name: 'Monza',
    country: 'Italia',
    laps: 5,
    parTime: 81.6,
    segments: [
      { len: 22, curve: 0.0, name: 'Rettifilo principale' },
      { len: 7, curve: -0.95, name: 'Variante del Rettifilo' },
      { len: 10, curve: 0.35, name: 'Curva Grande' },
      { len: 7, curve: 0.9, name: 'Variante della Roggia' },
      { len: 10, curve: -0.35, name: 'Lesmo 1' },
      { len: 10, curve: 0.28, name: 'Lesmo 2' },
      { len: 8, curve: -0.65, name: 'Ascari' },
      { len: 16, curve: 0.42, name: 'Parabolica' }
    ]
  },
  {
    id: 'silverstone',
    name: 'Silverstone',
    country: 'Regno Unito',
    laps: 5,
    parTime: 87.2,
    segments: [
      { len: 16, curve: 0.0, name: 'Hamilton Straight' },
      { len: 8, curve: -0.5, name: 'Abbey' },
      { len: 12, curve: 0.7, name: 'Village + Loop' },
      { len: 8, curve: -0.25, name: 'Aintree' },
      { len: 15, curve: 0.2, name: 'Wellington Straight' },
      { len: 12, curve: -0.72, name: 'Brooklands + Luffield' },
      { len: 14, curve: 0.8, name: 'Copse + Maggots' },
      { len: 9, curve: -0.58, name: 'Becketts + Chapel' }
    ]
  },
  {
    id: 'suzuka',
    name: 'Suzuka',
    country: 'Giappone',
    laps: 5,
    parTime: 89.4,
    segments: [
      { len: 12, curve: 0.15, name: 'Main straight' },
      { len: 14, curve: -0.68, name: 'Esses' },
      { len: 8, curve: 0.52, name: 'Dunlop' },
      { len: 9, curve: -0.83, name: 'Degner' },
      { len: 12, curve: 0.08, name: 'Hairpin' },
      { len: 11, curve: 0.3, name: 'Spoon' },
      { len: 15, curve: -0.1, name: 'Back straight' },
      { len: 9, curve: 0.65, name: '130R + Casio' }
    ]
  }
];

export function buildTrackGeometry(track) {
  const segments = [];
  track.segments.forEach((segment) => {
    for (let i = 0; i < segment.len; i += 1) {
      segments.push({ curve: segment.curve, label: i === Math.floor(segment.len / 2) ? segment.name : '' });
    }
  });
  return { segments, totalSegments: segments.length };
}

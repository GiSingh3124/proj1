import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

export const TEAMS = [
  { id:'mercedes', name:'Mercedes', primary:0x00d2be, secondary:0x111111, performance:1.000 },
  { id:'ferrari', name:'Ferrari', primary:0xe10600, secondary:0xffd400, performance:.997 },
  { id:'mclaren', name:'McLaren', primary:0xff8700, secondary:0x161616, performance:.994 },
  { id:'redbull', name:'Red Bull Racing', primary:0x1e41ff, secondary:0xff2d2d, performance:.991 },
  { id:'williams', name:'Williams', primary:0x005aff, secondary:0xffffff, performance:.982 },
  { id:'racingbulls', name:'Racing Bulls', primary:0x6692ff, secondary:0xffffff, performance:.978 },
  { id:'alpine', name:'Alpine', primary:0x2293d1, secondary:0xff87bc, performance:.975 },
  { id:'haas', name:'Haas', primary:0xf4f4f4, secondary:0xe32219, performance:.973 },
  { id:'audi', name:'Audi', primary:0xd3ff00, secondary:0x151515, performance:.971 },
  { id:'cadillac', name:'Cadillac', primary:0x111827, secondary:0xe7e7e7, performance:.969 },
  { id:'aston', name:'Aston Martin', primary:0x006f62, secondary:0xc5ff2e, performance:.967 },
];

const v = (x,y,z) => new THREE.Vector3(x,y,z);

export const TRACKS = [
  {
    id:'monza', name:'Monza', country:'Italia', laps:3, sky:0x77a9e8, fog:0xa9c8da,
    par:82.2, grip:1.0, roadWidth:15,
    points:[
      v(0,0,0),v(0,0,-95),v(2,0,-180),v(28,0,-215),v(67,0,-218),v(86,0,-195),
      v(78,0,-160),v(43,0,-145),v(18,0,-120),v(15,0,-72),v(45,0,-35),v(92,0,-30),
      v(130,0,-58),v(145,0,-103),v(131,0,-145),v(104,0,-174),v(84,0,-208),v(91,0,-252),
      v(125,0,-276),v(168,0,-270),v(202,0,-240),v(218,0,-190),v(208,0,-132),v(173,0,-85),
      v(132,0,-48),v(82,0,-15),v(36,0,5),v(0,0,0)
    ],
    landmarks:['Rettifilo','Prima Variante','Curva Grande','Roggia','Lesmo','Ascari','Parabolica']
  },
  {
    id:'silverstone', name:'Silverstone', country:'Regno Unito', laps:3, sky:0x7b879f, fog:0xb8c0ce,
    par:88.1, grip:.985, roadWidth:15,
    points:[
      v(0,0,0),v(-28,0,-55),v(-22,0,-105),v(20,0,-130),v(65,0,-120),v(83,0,-85),
      v(67,0,-50),v(35,0,-35),v(20,0,5),v(42,0,48),v(84,0,70),v(128,0,57),
      v(150,0,20),v(144,0,-30),v(174,0,-73),v(220,0,-84),v(250,0,-55),v(248,0,-10),
      v(219,0,25),v(178,0,38),v(142,0,65),v(112,0,104),v(66,0,116),v(18,0,93),v(-4,0,48),v(0,0,0)
    ],
    landmarks:['Abbey','Village','Wellington','Brooklands','Copse','Maggotts','Becketts']
  },
  {
    id:'suzuka', name:'Suzuka', country:'Giappone', laps:3, sky:0x6f9fcb, fog:0xb5cedf,
    par:90.0, grip:.97, roadWidth:14.5,
    points:[
      v(0,0,0),v(-5,0,-62),v(14,0,-112),v(48,0,-132),v(76,0,-113),v(82,0,-72),
      v(65,0,-36),v(35,0,-10),v(28,0,28),v(52,0,55),v(91,0,56),v(118,0,33),
      v(121,0,-5),v(103,0,-37),v(122,0,-68),v(163,0,-78),v(196,0,-58),v(204,0,-20),
      v(185,0,13),v(151,0,33),v(132,0,67),v(151,0,99),v(190,0,110),v(224,0,88),
      v(232,0,49),v(208,0,17),v(169,0,3),v(132,0,-17),v(92,0,-20),v(55,0,-2),v(0,0,0)
    ],
    landmarks:['T1','Esses','Dunlop','Degner','Hairpin','Spoon','130R']
  }
];

export const SESSION_FLOW = ['Q1','Q2','Q3','RACE'];
export const POINTS = [25,18,15,12,10,8,6,4,2,1];

export function createDrivers() {
  const lineups = [
    ['Russell','Antonelli'],
    ['Leclerc','Hamilton'],
    ['Norris','Piastri'],
    ['Verstappen','Hadjar'],
    ['Albon','Sainz'],
    ['Lawson','Lindblad'],
    ['Gasly','Colapinto'],
    ['Ocon','Bearman'],
    ['Hülkenberg','Bortoleto'],
    ['Pérez','Bottas'],
    ['Alonso','Stroll'],
  ];
  return TEAMS.flatMap((team,i)=>lineups[i].map((name,j)=>({
    id:`${team.id}-${j+1}`, name, team, skill:team.performance-(j*.002)+((10-i)*.00045)
  })));
}

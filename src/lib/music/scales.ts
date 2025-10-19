export type ScaleDef = {
  id: string;
  name: string;
  intervals: number[];      // semitones above root (0..11)
  degreeLabels: string[];   // display labels
};

export const SCALES: Record<string, ScaleDef> = {
  // --- 7-note diatonic (church modes) ---
  major:            { id:'major',            name:'Major',                    intervals:[0,2,4,5,7,9,11], degreeLabels:['1','2','3','4','5','6','7'] },
  ionian:           { id:'ionian',           name:'Major (Ionian)',           intervals:[0,2,4,5,7,9,11], degreeLabels:['1','2','3','4','5','6','7'] },
  dorian:           { id:'dorian',           name:'Dorian',                    intervals:[0,2,3,5,7,9,10], degreeLabels:['1','2','b3','4','5','6','b7'] },
  phrygian:         { id:'phrygian',         name:'Phrygian',                  intervals:[0,1,3,5,7,8,10], degreeLabels:['1','b2','b3','4','5','b6','b7'] },
  lydian:           { id:'lydian',           name:'Lydian',                    intervals:[0,2,4,6,7,9,11], degreeLabels:['1','2','3','#4','5','6','7'] },
  mixolydian:       { id:'mixolydian',       name:'Mixolydian',                intervals:[0,2,4,5,7,9,10], degreeLabels:['1','2','3','4','5','6','b7'] },
  aeolian:          { id:'aeolian',          name:'Natural Minor (Aeolian)',   intervals:[0,2,3,5,7,8,10], degreeLabels:['1','2','b3','4','5','b6','b7'] },
  locrian:          { id:'locrian',          name:'Locrian',                   intervals:[0,1,3,5,6,8,10], degreeLabels:['1','b2','b3','4','b5','b6','b7'] },

  // --- Harmonic Minor + modes ---
  harmonicMinor:    { id:'harmonicMinor',    name:'Harmonic Minor',            intervals:[0,2,3,5,7,8,11], degreeLabels:['1','2','b3','4','5','b6','7'] },
  locrianNat6:      { id:'locrianNat6',      name:'Locrian ♮6 (HM mode 2)',    intervals:[0,1,3,5,6,9,10], degreeLabels:['1','b2','b3','4','b5','6','b7'] },
  ionianSharp5:     { id:'ionianSharp5',     name:'Ionian ♯5 (HM mode 3)',     intervals:[0,2,4,5,8,9,11], degreeLabels:['1','2','3','4','♯5','6','7'] },
  dorianSharp4:     { id:'dorianSharp4',     name:'Dorian ♯4 (HM mode 4)',     intervals:[0,2,3,6,7,9,10], degreeLabels:['1','2','b3','♯4','5','6','b7'] },
  phrygianDom:      { id:'phrygianDom',      name:'Phrygian Dominant (HM5)',   intervals:[0,1,4,5,7,8,10], degreeLabels:['1','b2','3','4','5','b6','b7'] },
  lydianSharp2:     { id:'lydianSharp2',     name:'Lydian ♯2 (HM mode 6)',     intervals:[0,3,4,6,7,9,11], degreeLabels:['1','♯2','3','♯4','5','6','7'] },
  ultralocrian:     { id:'ultralocrian',     name:'Ultralocrian (HM mode 7)',  intervals:[0,1,3,4,6,8,9],  degreeLabels:['1','b2','b3','3','b5','b6','6'] },

  // --- Melodic Minor (ascending) + modes ---
  melodicMinorAsc:  { id:'melodicMinorAsc',  name:'Melodic Minor (asc)',       intervals:[0,2,3,5,7,9,11], degreeLabels:['1','2','b3','4','5','6','7'] },
  dorianb2:         { id:'dorianb2',         name:'Dorian b2 (MM mode 2)',     intervals:[0,1,3,5,7,9,10], degreeLabels:['1','b2','b3','4','5','6','b7'] },
  lydianAug:        { id:'lydianAug',        name:'Lydian Augmented',          intervals:[0,2,4,6,8,9,11], degreeLabels:['1','2','3','♯4','♯5','6','7'] },
  lydianDom:        { id:'lydianDom',        name:'Lydian Dominant',           intervals:[0,2,4,6,7,9,10], degreeLabels:['1','2','3','♯4','5','6','b7'] },
  mixolydianb6:     { id:'mixolydianb6',     name:'Mixolydian b6',             intervals:[0,2,4,5,7,8,10], degreeLabels:['1','2','3','4','5','b6','b7'] },
  locrianNat2:      { id:'locrianNat2',      name:'Locrian ♮2',                 intervals:[0,2,3,5,6,8,10], degreeLabels:['1','2','b3','4','b5','b6','b7'] },
  altered:          { id:'altered',          name:'Altered (Super-Locrian)',   intervals:[0,1,3,4,6,8,10], degreeLabels:['1','b2','b3','3','b5','b6','b7'] },

  // --- Pentatonic families ---
  pentatonicMajor:  { id:'pentatonicMajor',  name:'Pentatonic (Major)',        intervals:[0,2,4,7,9],      degreeLabels:['1','2','3','5','6'] },
  pentatonicMinor:  { id:'pentatonicMinor',  name:'Pentatonic (Minor)',        intervals:[0,3,5,7,10],     degreeLabels:['1','b3','4','5','b7'] },
  pentatonicBlues:  { id:'pentatonicBlues',  name:'Blues (Minor Pent + b5)',   intervals:[0,3,5,6,7,10],   degreeLabels:['1','b3','4','b5','5','b7'] },
  japanInSen:       { id:'japanInSen',       name:'Japanese In Sen',           intervals:[0,1,5,7,10],     degreeLabels:['1','b2','4','5','b7'] },
  japanHirajoshi:   { id:'japanHirajoshi',   name:'Hirajoshi',                 intervals:[0,2,3,7,8],      degreeLabels:['1','2','b3','5','b6'] },

  // --- Symmetric / synthetic ---
  wholeTone:        { id:'wholeTone',        name:'Whole Tone',                intervals:[0,2,4,6,8,10],   degreeLabels:['1','2','3','♯4/♭5','♯5','b7'] },
  diminishedHW:     { id:'diminishedHW',     name:'Diminished (H-W)',          intervals:[0,1,3,4,6,7,9,10], degreeLabels:['1','b2','#2/♭3','3','b5','5','6','b7'] },
  diminishedWH:     { id:'diminishedWH',     name:'Diminished (W-H)',          intervals:[0,2,3,5,6,8,9,11], degreeLabels:['1','2','b3','4','b5','♭6/#5','6','7'] },
  chromatic:        { id:'chromatic',        name:'Chromatic (12-tone)',       intervals:[0,1,2,3,4,5,6,7,8,9,10,11], degreeLabels:['1','b2','2','b3','3','4','b5','5','♯5/♭6','6','b7','7'] },

  // --- Popular “exotic” heptatonic scales ---
  doubleHarmonic:   { id:'doubleHarmonic',   name:'Double Harmonic (Byzantine)', intervals:[0,1,4,5,7,8,11], degreeLabels:['1','b2','3','4','5','b6','7'] },
  neapolitanMinor:  { id:'neapolitanMinor',  name:'Neapolitan Minor',          intervals:[0,1,3,5,7,8,11], degreeLabels:['1','b2','b3','4','5','b6','7'] },
  neapolitanMajor:  { id:'neapolitanMajor',  name:'Neapolitan Major',          intervals:[0,1,3,5,7,9,11], degreeLabels:['1','b2','b3','4','5','6','7'] },
  hungarianMinor:   { id:'hungarianMinor',   name:'Hungarian Minor',           intervals:[0,2,3,6,7,8,11], degreeLabels:['1','2','b3','♯4','5','b6','7'] },
  hungarianMajor:   { id:'hungarianMajor',   name:'Hungarian Major',           intervals:[0,3,4,6,7,9,10], degreeLabels:['1','♯2','3','♯4','5','6','b7'] },
  persian:          { id:'persian',          name:'Persian',                   intervals:[0,1,4,5,6,8,11], degreeLabels:['1','b2','3','4','b5','b6','7'] },
  arabian:          { id:'arabian',          name:'Arabian (Hijaz-ish)',       intervals:[0,1,4,5,7,8,10], degreeLabels:['1','b2','3','4','5','b6','b7'] },
  spanishGypsy:     { id:'spanishGypsy',     name:'Spanish Gypsy (Phryg Dom)', intervals:[0,1,4,5,7,8,10], degreeLabels:['1','b2','3','4','5','b6','b7'] },
  enigmatic:        { id:'enigmatic',        name:'Enigmatic',                 intervals:[0,1,4,6,8,10,11], degreeLabels:['1','b2','3','♯4','♯5','b7','7'] },
  acoustic:         { id:'acoustic',         name:'Acoustic (Lydian Dominant b7?)', intervals:[0,2,4,6,7,9,10], degreeLabels:['1','2','3','♯4','5','6','b7'] },
  lydianFlat7:      { id:'lydianFlat7',      name:'Lydian ♭7 (Overtone)',      intervals:[0,2,4,6,7,9,10], degreeLabels:['1','2','3','♯4','5','6','b7'] },

  // --- Blues “heptatonic” variants (add passing tones) ---
  majorBlues:       { id:'majorBlues',       name:'Blues (Major)',             intervals:[0,2,3,4,7,9],    degreeLabels:['1','2','b3','3','5','6'] },
  dominantBebop:    { id:'dominantBebop',    name:'Bebop (Dominant)',          intervals:[0,2,4,5,7,9,10,11], degreeLabels:['1','2','3','4','5','6','b7','7'] },
  majorBebop:       { id:'majorBebop',       name:'Bebop (Major)',             intervals:[0,2,4,5,7,8,9,11], degreeLabels:['1','2','3','4','5','b6','6','7'] },
  minorBebop:       { id:'minorBebop',       name:'Bebop (Minor / Dorian+7)',  intervals:[0,2,3,5,7,9,10,11], degreeLabels:['1','2','b3','4','5','6','b7','7'] },

  // --- Triads / arpeggio-ish (useful overlays) ---
  majorTriad:       { id:'majorTriad',       name:'Triad (Major)',             intervals:[0,4,7],          degreeLabels:['1','3','5'] },
  minorTriad:       { id:'minorTriad',       name:'Triad (Minor)',             intervals:[0,3,7],          degreeLabels:['1','b3','5'] },
  diminishedTriad:  { id:'diminishedTriad',  name:'Triad (Diminished)',        intervals:[0,3,6],          degreeLabels:['1','b3','b5'] },
  augmentedTriad:   { id:'augmentedTriad',   name:'Triad (Augmented)',         intervals:[0,4,8],          degreeLabels:['1','3','♯5'] },
};

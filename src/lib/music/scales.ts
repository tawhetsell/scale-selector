export type ScaleDef = {
  id: string;
  name: string;
  intervals: number[];      // semitones above root (0..11)
  degreeLabels: string[];   // display labels
  group?: string;            // category for dropdown grouping
};

export const SCALES: Record<string, ScaleDef> = {
  // --- 7-note diatonic (church modes) ---
  major:            { id:'major',       name:'Major',                    intervals:[0,2,4,5,7,9,11], degreeLabels:['1','2','3','4','5','6','7'], group:'Diatonic Modes' },
  ionian:           { id:'ionian',      name:'Major (Ionian)',           intervals:[0,2,4,5,7,9,11], degreeLabels:['1','2','3','4','5','6','7'], group:'Diatonic Modes' },
  dorian:           { id:'dorian',      name:'Dorian',                   intervals:[0,2,3,5,7,9,10], degreeLabels:['1','2','b3','4','5','6','b7'], group:'Diatonic Modes' },
  phrygian:         { id:'phrygian',    name:'Phrygian',                 intervals:[0,1,3,5,7,8,10], degreeLabels:['1','b2','b3','4','5','b6','b7'], group:'Diatonic Modes' },
  lydian:           { id:'lydian',      name:'Lydian',                   intervals:[0,2,4,6,7,9,11], degreeLabels:['1','2','3','#4','5','6','7'], group:'Diatonic Modes' },
  mixolydian:       { id:'mixolydian',  name:'Mixolydian',               intervals:[0,2,4,5,7,9,10], degreeLabels:['1','2','3','4','5','6','b7'], group:'Diatonic Modes' },
  aeolian:          { id:'aeolian',     name:'Aeolian (Nat)',            intervals:[0,2,3,5,7,8,10], degreeLabels:['1','2','b3','4','5','b6','b7'], group:'Diatonic Modes' },
  locrian:          { id:'locrian',     name:'Locrian',                  intervals:[0,1,3,5,6,8,10], degreeLabels:['1','b2','b3','4','b5','b6','b7'], group:'Diatonic Modes' },

  // --- Harmonic Minor + modes ---
  harmonicMinor:    { id:'harmonicMinor', name:'Harmonic Minor',         intervals:[0,2,3,5,7,8,11], degreeLabels:['1','2','b3','4','5','b6','7'], group:'Harmonic Minor' },
  locrianNat6:      { id:'locrianNat6',   name:'Locrian ♮6',             intervals:[0,1,3,5,6,9,10], degreeLabels:['1','b2','b3','4','b5','6','b7'], group:'Harmonic Minor' },
  ionianSharp5:     { id:'ionianSharp5',  name:'Ionian ♯5',              intervals:[0,2,4,5,8,9,11], degreeLabels:['1','2','3','4','♯5','6','7'], group:'Harmonic Minor' },
  dorianSharp4:     { id:'dorianSharp4',  name:'Dorian ♯4',              intervals:[0,2,3,6,7,9,10], degreeLabels:['1','2','b3','♯4','5','6','b7'], group:'Harmonic Minor' },
  phrygianDom:      { id:'phrygianDom',   name:'Phrygian Dom',           intervals:[0,1,4,5,7,8,10], degreeLabels:['1','b2','3','4','5','b6','b7'], group:'Harmonic Minor' },
  lydianSharp2:     { id:'lydianSharp2',  name:'Lydian ♯2',              intervals:[0,3,4,6,7,9,11], degreeLabels:['1','♯2','3','♯4','5','6','7'], group:'Harmonic Minor' },
  ultralocrian:     { id:'ultralocrian',  name:'Ultralocrian',           intervals:[0,1,3,4,6,8,9],  degreeLabels:['1','b2','b3','3','b5','b6','6'], group:'Harmonic Minor' },

  // --- Melodic Minor (ascending) + modes ---
  melodicMinorAsc:  { id:'melodicMinorAsc', name:'Melodic Minor',       intervals:[0,2,3,5,7,9,11], degreeLabels:['1','2','b3','4','5','6','7'], group:'Melodic Minor' },
  dorianb2:         { id:'dorianb2',        name:'Dorian ♭2',           intervals:[0,1,3,5,7,9,10], degreeLabels:['1','b2','b3','4','5','6','b7'], group:'Melodic Minor' },
  lydianAug:        { id:'lydianAug',       name:'Lydian Aug',          intervals:[0,2,4,6,8,9,11], degreeLabels:['1','2','3','♯4','♯5','6','7'], group:'Melodic Minor' },
  lydianDom:        { id:'lydianDom',       name:'Lydian Dominant',     intervals:[0,2,4,6,7,9,10], degreeLabels:['1','2','3','♯4','5','6','b7'], group:'Melodic Minor' },
  mixolydianb6:     { id:'mixolydianb6',    name:'Mixolydian ♭6',       intervals:[0,2,4,5,7,8,10], degreeLabels:['1','2','3','4','5','b6','b7'], group:'Melodic Minor' },
  locrianNat2:      { id:'locrianNat2',     name:'Locrian ♮2',          intervals:[0,2,3,5,6,8,10], degreeLabels:['1','2','b3','4','b5','b6','b7'], group:'Melodic Minor' },
  altered:          { id:'altered',         name:'Altered',             intervals:[0,1,3,4,6,8,10], degreeLabels:['1','b2','b3','3','b5','b6','b7'], group:'Melodic Minor' },

  // --- Pentatonic families ---
  pentatonicMajor:  { id:'pentatonicMajor', name:'Pentatonic Maj',      intervals:[0,2,4,7,9],      degreeLabels:['1','2','3','5','6'], group:'Pentatonic' },
  pentatonicMinor:  { id:'pentatonicMinor', name:'Pentatonic Min',      intervals:[0,3,5,7,10],     degreeLabels:['1','b3','4','5','b7'], group:'Pentatonic' },
  pentatonicBlues:  { id:'pentatonicBlues', name:'Blues (Pent+♭5)',     intervals:[0,3,5,6,7,10],   degreeLabels:['1','b3','4','b5','5','b7'], group:'Pentatonic' },
  japanInSen:       { id:'japanInSen',      name:'In Sen (Jpn)',        intervals:[0,1,5,7,10],     degreeLabels:['1','b2','4','5','b7'], group:'Pentatonic' },
  japanHirajoshi:   { id:'japanHirajoshi',  name:'Hirajoshi (Jpn)',     intervals:[0,2,3,7,8],      degreeLabels:['1','2','b3','5','b6'], group:'Pentatonic' },

  // --- Symmetric / synthetic ---
  wholeTone:        { id:'wholeTone',       name:'Whole Tone',          intervals:[0,2,4,6,8,10],   degreeLabels:['1','2','3','♯4/♭5','♯5','b7'], group:'Symmetric' },
  diminishedHW:     { id:'diminishedHW',    name:'Dim (H–W)',           intervals:[0,1,3,4,6,7,9,10], degreeLabels:['1','b2','#2/♭3','3','b5','5','6','b7'], group:'Symmetric' },
  diminishedWH:     { id:'diminishedWH',    name:'Dim (W–H)',           intervals:[0,2,3,5,6,8,9,11], degreeLabels:['1','2','b3','4','b5','#5/♭6','6','7'], group:'Symmetric' },

  // --- Popular "exotic" heptatonic scales ---
  doubleHarmonic:   { id:'doubleHarmonic',  name:'Double Harmonic',     intervals:[0,1,4,5,7,8,11], degreeLabels:['1','b2','3','4','5','b6','7'], group:'Exotic' },
  neapolitanMinor:  { id:'neapolitanMinor', name:'Neapolitan Min',      intervals:[0,1,3,5,7,8,11], degreeLabels:['1','b2','b3','4','5','b6','7'], group:'Exotic' },
  neapolitanMajor:  { id:'neapolitanMajor', name:'Neapolitan Maj',      intervals:[0,1,3,5,7,9,11], degreeLabels:['1','b2','b3','4','5','6','7'], group:'Exotic' },
  hungarianMinor:   { id:'hungarianMinor',  name:'Hungarian Min',       intervals:[0,2,3,6,7,8,11], degreeLabels:['1','2','b3','♯4','5','b6','7'], group:'Exotic' },
  hungarianMajor:   { id:'hungarianMajor',  name:'Hungarian Maj',       intervals:[0,3,4,6,7,9,10], degreeLabels:['1','♯2','3','♯4','5','6','b7'], group:'Exotic' },
  persian:          { id:'persian',         name:'Persian',             intervals:[0,1,4,5,6,8,11], degreeLabels:['1','b2','3','4','b5','b6','7'], group:'Exotic' },
  enigmatic:        { id:'enigmatic',       name:'Enigmatic',           intervals:[0,1,4,6,8,10,11], degreeLabels:['1','b2','3','♯4','♯5','b7','7'], group:'Exotic' },

  // --- Blues & bebop ---
  majorBlues:       { id:'majorBlues',      name:'Major Blues',         intervals:[0,2,3,4,7,9],    degreeLabels:['1','2','b3','3','5','6'], group:'Blues & Bebop' },
  dominantBebop:    { id:'dominantBebop',   name:'Bebop Dominant',      intervals:[0,2,4,5,7,9,10,11], degreeLabels:['1','2','3','4','5','6','b7','7'], group:'Blues & Bebop' },
  majorBebop:       { id:'majorBebop',      name:'Bebop Major',         intervals:[0,2,4,5,7,8,9,11], degreeLabels:['1','2','3','4','5','b6','6','7'], group:'Blues & Bebop' },
  minorBebop:       { id:'minorBebop',      name:'Bebop Minor',         intervals:[0,2,3,5,7,9,10,11], degreeLabels:['1','2','b3','4','5','6','b7','7'], group:'Blues & Bebop' },
  minorSixthDim:    { id:'minorSixthDim',   name:'Minor 6th Diminished (Barry Harris)', intervals:[0,2,3,5,7,8,9,11], degreeLabels:['1','2','b3','4','5','♯5','6','7'], group:'Blues & Bebop' },

  // --- Triads ---
  majorTriad:       { id:'majorTriad',      name:'Triad Major',         intervals:[0,4,7],          degreeLabels:['1','3','5'], group:'Triads' },
  minorTriad:       { id:'minorTriad',      name:'Triad Minor',         intervals:[0,3,7],          degreeLabels:['1','b3','5'], group:'Triads' },
  diminishedTriad:  { id:'diminishedTriad', name:'Triad Dim',           intervals:[0,3,6],          degreeLabels:['1','b3','b5'], group:'Triads' },
  augmentedTriad:   { id:'augmentedTriad',  name:'Triad Aug',           intervals:[0,4,8],          degreeLabels:['1','3','♯5'], group:'Triads' },
};

export type ScaleGroup = {
  label: string;
  scales: ScaleDef[];
};

/** Scales grouped by category, in definition order. Excludes Ionian (duplicate of Major). */
export function getGroupedScales(): ScaleGroup[] {
  const groups: ScaleGroup[] = [];
  const seen = new Set<string>();

  for (const scale of Object.values(SCALES)) {
    if (scale.id === 'ionian') continue;
    const label = scale.group ?? 'Other';
    if (!seen.has(label)) {
      seen.add(label);
      groups.push({ label, scales: [] });
    }
    groups.find(g => g.label === label)!.scales.push(scale);
  }

  return groups;
}

let audioCtx: AudioContext | null = null;
let bgmOscillators: any[] = [];
let bgmInterval: any = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playBGM = () => {
  const ctx = initAudio();
  
  if (bgmInterval) return; // already playing
  
  const notes = [
    261.63, // C4
    329.63, // E4
    392.00, // G4
    523.25, // C5
  ];
  let noteIndex = 0;
  
  const playNextNote = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = notes[noteIndex];
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    
    noteIndex = (noteIndex + 1) % notes.length;
  };
  
  bgmInterval = setInterval(playNextNote, 500);
  playNextNote();
};

export const stopBGM = () => {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
};

export const playTick = () => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

export const playWin = () => {
  const ctx = initAudio();
  
  const playNote = (freq: number, startTime: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };
  
  const now = ctx.currentTime;
  playNote(440, now, 0.1); // A4
  playNote(554.37, now + 0.1, 0.1); // C#5
  playNote(659.25, now + 0.2, 0.3); // E5
  playNote(880, now + 0.3, 0.5); // A5
};

export const playLose = () => {
  const ctx = initAudio();
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
  
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
};

let spinTimeout: any = null;

export const startSpinSound = () => {
  const startTime = Date.now();
  const duration = 5000; // Match wheel spin duration
  
  const tick = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) return;
    
    playTick();
    
    const progress = elapsed / duration;
    const delay = 30 + Math.pow(progress, 2.5) * 400;
    
    spinTimeout = setTimeout(tick, delay);
  };
  
  tick();
};

export const stopSpinSound = () => {
  if (spinTimeout) {
    clearTimeout(spinTimeout);
    spinTimeout = null;
  }
};

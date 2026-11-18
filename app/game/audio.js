const TEMPO=104;
const phrase=[62,65,69,72,74,72,69,65, 67,70,74,77,76,74,70,67, 65,69,72,76,74,72,67,69, 62,65,69,72,69,65,64,62];
const roots=[38,43,41,38];
const toHz=note=>440*2**((note-69)/12);
const beat=60/TEMPO;
const voiceLines={
  shout:{file:'look',speech:'Look at Bobo!'},
  dag:{file:'dag',speech:'Dag!'},
  win:{file:'win'},
};

const voiceURL=kind=>new URL('../assets/'+voiceLines[kind].file+'.wav',import.meta.url);

export function makeAudio(musicEnabled=true, muted=false) {
  let audio=null,master=null,musicBus=null,voiceBus=null, active=false,timer=null,
    note=0,next=0,volume=.65,music=musicEnabled,voice=true;
  const samples=new Map();
  const loading=new Map();
  const events=[];
  const voices=new Set();
  const contextClass=globalThis.AudioContext??globalThis.webkitAudioContext;
  const noteLog=(kind)=>{events.push(kind); if(events.length>128)events.shift();};

  function fetchVoice(kind){
    if(!audio || loading.has(kind))return;
    loading.set(kind, fetch(voiceURL(kind))
      .then(response=>response.ok?response.arrayBuffer():Promise.reject(Error('voice sample missing')))
      .then(bytes=>audio.decodeAudioData(bytes))
      .then(buffer=>samples.set(kind,buffer))
      .catch(()=>{}));
  }

  function unlock(){
    if(muted||!contextClass)return;
    if(!audio){
      audio=new contextClass();
      master=audio.createGain();master.gain.value=volume;master.connect(audio.destination);
      musicBus=audio.createGain();musicBus.gain.value=music?.36:0;musicBus.connect(master);
      voiceBus=audio.createGain();voiceBus.gain.value=voice?1:0;voiceBus.connect(master);
      for(const kind of Object.keys(voiceLines))fetchVoice(kind);
    }
    audio.resume().catch(()=>{});
    if(active && music)resumeMusic();
  }

  function pluck(midi,start,duration,level,bus,wave='triangle'){
    const osc=audio.createOscillator(), env=audio.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(toHz(midi),start);
    const gain=env.gain;
    gain.setValueAtTime(.0001,start);
    gain.exponentialRampToValueAtTime(level,start+.017);
    gain.exponentialRampToValueAtTime(.001,start+duration);
    osc.connect(env);env.connect(bus);osc.start(start);osc.stop(start+duration+.01);
    osc.onended=()=>{env.disconnect();osc.disconnect();};
  }

  function schedule(){
    if(!audio || !active || !music)return;
    while(next < audio.currentTime+.18){
      const step=note%32;
      pluck(phrase[step],next,beat*(step%2?.75:.55),.13,musicBus);
      if(step%4===0){
        const root=roots[Math.floor(step/8)];
        pluck(root+(step%8?7:0),next,beat*1.7,.17,musicBus,'sine');
      }
      if(step%8===4)pluck(phrase[step]-12,next+.09,beat*.85,.066,musicBus);
      note++;next+=beat*.5;
      noteLog('midi');
    }
  }
  function resumeMusic(){
    if(!audio || timer || !active || !music)return;
    next=audio.currentTime+.03;
    musicBus.gain.setTargetAtTime(.36,audio.currentTime,.02);
    schedule();
    timer=setInterval(schedule,65);
  }

  function setActive(enabled){
    active=enabled;
    if(enabled){
      if(music)resumeMusic();
    }else{
      clearInterval(timer);timer=null;
      if(audio)musicBus.gain.setTargetAtTime(0,audio.currentTime,.02);
    }
  }

  function speak(kind){
    if(!active && kind!=='win')return;
    noteLog(kind);
    if(!voice || muted)return;
    unlock();
    const sample=samples.get(kind);
    if(sample){
      const source=audio.createBufferSource();
      source.buffer=sample;source.connect(voiceBus);
      const delayed=kind==='shout'?0:.28;
      if(kind==='shout'){
        for(const old of voices){try{old.stop();}catch{/* already ended */}}
        voices.clear();
      }
      source.start(audio.currentTime+delayed);
      voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();};
    }else if(kind==='win'){
      const ending=new Audio(voiceURL(kind));
      ending.volume=volume;
      ending.play().catch(()=>{});
    }else if(globalThis.speechSynthesis && globalThis.SpeechSynthesisUtterance){
      const speech=new SpeechSynthesisUtterance(voiceLines[kind].speech);
      speech.voice=speechSynthesis.getVoices().find(v=>/Samantha|Karen|female/i.test(v.name))??null;
      speech.lang='en-US'; speech.rate=.91; speech.volume=volume;
      speechSynthesis.speak(speech);
    }
  }

  function reward(kind){
    noteLog('effect:'+kind);
    if(!audio||muted)return;
    const start=audio.currentTime;
    if(kind==='patriot'){
      [67,72,76,79,84].forEach((tone,i)=>pluck(tone,start+.048*i,.28,.080,master,'sine'));
      [55,62,67].forEach(tone=>pluck(tone,start+.18,.34,.035,master,'triangle'));
      return;
    }
    const tones=kind==='dag'?[55,49]:kind==='win'?[67,72,76,79]:[69,74,81];
    tones.forEach((tone,i)=>pluck(tone,start+.045*i,.25,.078,master,'sine'));
  }

  return {unlock,setActive,speak,reward,
    settings(values){
      volume=values.volume;voice=values.voice;music=values.music;
      if(audio){
        master.gain.setTargetAtTime(volume,audio.currentTime,.02);
        voiceBus.gain.setTargetAtTime(voice?1:0,audio.currentTime,.02);
      }
      setActive(false);setActive(values.active);
    },
    status(){return {events:[...events],loaded:[...samples.keys()],music,voice,active,notes:note};},
  };
}

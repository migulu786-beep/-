import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { AppState, HandGesture } from './types';
import Scene from './components/Scene';
import HandController from './components/HandController';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.TREE);
  const [rotationInput, setRotationInput] = useState<number>(0.5); // 0.5 is center
  const [gestureStatus, setGestureStatus] = useState<string>("Ready");
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize Audio logic
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
        audio.volume = 0.4;
        // Attempt autoplay
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => setIsPlaying(true))
                .catch((error) => {
                    console.log("Autoplay prevented by browser policy:", error);
                    setIsPlaying(false);
                });
        }
    }
  }, []);

  const toggleState = () => {
    // If music was blocked by autoplay policy, try starting it on first interaction
    const audio = audioRef.current;
    if (audio && audio.paused && !isPlaying) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error("Audio play failed:", e));
    }
    
    setAppState(prev => prev === AppState.TREE ? AppState.EXPLODE : AppState.TREE);
  };

  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent scene toggle
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const handleGestureUpdate = useCallback((gesture: HandGesture) => {
    if (!gesture.handPresent) {
      setGestureStatus("No Hand Detected");
      return; 
    }
    
    setRotationInput(gesture.palmPositionX);

    if (gesture.isPinching) {
      setAppState(AppState.TREE);
      setGestureStatus("Gesture: Pinch (Tree)");
    } else {
      setAppState(AppState.EXPLODE);
      setGestureStatus("Gesture: Open (Explode)");
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos: string[] = [];
      Array.from(e.target.files).forEach(file => {
        newPhotos.push(URL.createObjectURL(file as Blob));
      });
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#050103] text-white overflow-hidden select-none">
      
      {/* Declarative Audio Element - More stable than new Audio() */}
      <audio 
        ref={audioRef}
        src="https://ia803407.us.archive.org/3/items/jingle-bell-rock-bobby-helms-1957/Jingle%20Bell%20Rock%20-%20Bobby%20Helms%20%281957%29.mp3"
        loop
      />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start">
        {/* Top Left - Artistic Greeting */}
        <div className="flex flex-col items-start mix-blend-screen">
          <h1 className="text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white via-pink-200 to-pink-400 drop-shadow-[0_0_20px_rgba(255,105,180,0.8)] leading-tight mt-1" style={{ fontFamily: "'Great Vibes', cursive" }}>
            Merry Christmas <br/> Not just today
          </h1>
          <h2 className="text-4xl text-pink-100 drop-shadow-[0_0_15px_rgba(255,192,203,0.6)] ml-1 mt-2" style={{ fontFamily: "'Great Vibes', cursive" }}>
            TO Lou Zhaoqi
          </h2>
        </div>
        
        {/* Top Right - Controls Info */}
        <div className="text-right">
           <div className="bg-black/40 backdrop-blur-md border border-pink-500/30 p-4 rounded-xl">
             <p className="text-xs text-pink-400 uppercase font-bold mb-2">Controls</p>
             <ul className="text-xs text-gray-300 space-y-1 font-mono">
               <li><span className="text-white">CLICK</span> Screen to Toggle</li>
               <li><span className="text-white">PINCH</span> Hand to Form Tree</li>
               <li><span className="text-white">OPEN</span> Hand to Explode</li>
               <li><span className="text-white">MOVE</span> Hand to Rotate</li>
             </ul>
           </div>
        </div>
      </div>

      {/* Bottom Left Status & Music Control */}
      <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-3">
          {/* Status Block */}
          <div className="pointer-events-none">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${appState === AppState.TREE ? 'bg-green-500 shadow-[0_0_10px_#0f0]' : 'bg-red-500 shadow-[0_0_10px_#f00]'}`}></div>
              <span className="font-mono text-sm tracking-wider uppercase">{appState} MODE</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{gestureStatus}</p>
          </div>

          {/* Music Toggle */}
          <button 
            onClick={toggleMusic} 
            className="flex items-center space-x-2 text-pink-300 hover:text-white transition-all group pointer-events-auto"
          >
             <div className="p-2 rounded-full bg-white/10 group-hover:bg-pink-500/20 backdrop-blur-md border border-white/10 group-hover:border-pink-500/50">
               {isPlaying ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-pulse">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                 </svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                 </svg>
               )}
             </div>
             <span className="text-xs font-mono uppercase opacity-70 group-hover:opacity-100">{isPlaying ? "Music ON" : "Music OFF"}</span>
          </button>
      </div>

      {/* Upload Button - Moved up slightly to avoid collision */}
      <div className="absolute bottom-32 left-8 z-20">
         <label className="cursor-pointer group flex items-center space-x-2 bg-black/30 hover:bg-pink-500/20 backdrop-blur-md border border-white/20 hover:border-pink-400 text-white px-4 py-2 rounded-lg transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span className="font-mono text-sm tracking-widest">UPLOAD PHOTOS</span>
            <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
         </label>
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-full cursor-pointer" onClick={toggleState}>
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: false }}>
          <Scene appState={appState} rotationTarget={rotationInput} photos={photos} />
        </Canvas>
      </div>

      {/* AI Controller */}
      <HandController onGestureUpdate={handleGestureUpdate} />
      
    </div>
  );
};

export default App;
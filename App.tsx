
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toilet } from './components/Toilet';
import { Poop } from './components/Poop';
import { GameState, PoopItem, ToiletTarget, ColorType, Position } from './types';
import { initAudio, playPop, playGrab, playSplash, playFart, playWin, playLose } from './services/audioService';

// Constants
const TOILET_SIZE = { width: 120, height: 140 };
const SNAP_THRESHOLD = 60;
const TARGET_SCORE = 15; // Number of poops to flush to win
const SPAWN_INTERVAL = 900; // ms - FASTER!
const MAX_ON_SCREEN = 12; // Prevent lag if player is too slow
const MAX_LIVES = 5;

// Helper to generate random integer
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES);
  const [poopsFlushed, setPoopsFlushed] = useState(0);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    poops: [],
    toilets: [],
    score: 0,
    gameOver: false,
    effects: [],
  });
  
  // Refs for interval management and drag state
  const draggingId = useRef<string | null>(null);
  const offset = useRef<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const effectIdCounter = useRef(0);
  const poopsSpawnedCount = useRef(0);

  // Helper to add visual effect
  const addEffect = (x: number, y: number, text: string, color: string = '#2563eb') => {
    const id = effectIdCounter.current++;
    setGameState(prev => ({
      ...prev,
      effects: [...prev.effects, { id, x, y, text, color }]
    }));

    // Auto-remove effect after animation
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        effects: prev.effects.filter(e => e.id !== id)
      }));
    }, 800);
  };

  // Initialize Level
  const startLevel = useCallback(() => {
    initAudio(); // Start audio context
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Define safe zones
    const toiletY = height * 0.75;

    // Create Toilets
    const colors = [ColorType.BLUE, ColorType.RED, ColorType.GREEN];
    const toilets: ToiletTarget[] = colors.map((color, index) => ({
      id: `toilet-${color}`,
      color,
      position: {
        x: (width / 4) * (index + 1),
        y: toiletY
      },
      size: TOILET_SIZE,
      isOpen: false
    }));

    // Initial State
    setGameState({
      poops: [],
      toilets,
      score: 0,
      gameOver: false,
      effects: []
    });
    setLives(MAX_LIVES);
    setPoopsFlushed(0);
    setGameResult(null);
    setGameStarted(true);
    poopsSpawnedCount.current = 0;
    
    // Spawn initial batch
    spawnPoop(2, width, height * 0.3, toilets);
  }, []);

  // Spawn Logic
  const spawnPoop = (count: number, screenW: number, zoneY: number, toilets: ToiletTarget[]) => {
    const colors = [ColorType.BLUE, ColorType.RED, ColorType.GREEN];
    
    setGameState(prev => {
      // Limit onscreen items
      if (prev.poops.length >= MAX_ON_SCREEN) return prev;

      const newPoops = [...prev.poops];
      for (let i = 0; i < count; i++) {
        poopsSpawnedCount.current += 1;
        const color = colors[randomInt(0, 2)];
        newPoops.push({
          id: `poop-${poopsSpawnedCount.current}`,
          color,
          position: {
            x: randomInt(50, screenW - 50),
            y: randomInt(80, zoneY + 100)
          },
          initialPosition: { x: 0, y: 0 }, 
          isFlushed: false,
          isDragging: false,
          rotation: randomInt(-15, 15),
          shake: false
        });
        playPop();
      }
      return { ...prev, poops: newPoops };
    });
  };

  // Game Loop / Spawner
  useEffect(() => {
    if (!gameStarted || gameState.gameOver) return;

    const interval = setInterval(() => {
       // Continuous spawning until game over
       spawnPoop(1, window.innerWidth, window.innerHeight * 0.3, gameState.toilets);
    }, SPAWN_INTERVAL);

    return () => clearInterval(interval);
  }, [gameStarted, gameState.gameOver, gameState.toilets]);

  // --- Physics & Interaction Handlers ---

  const handleDragStart = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    if (gameState.gameOver) return;
    draggingId.current = id;
    playGrab();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const poop = gameState.poops.find(p => p.id === id);
    if (!poop) return;

    offset.current = {
      x: clientX - poop.position.x,
      y: clientY - poop.position.y
    };

    setGameState(prev => ({
      ...prev,
      poops: prev.poops.map(p => p.id === id ? { ...p, isDragging: true, rotation: 0, shake: false } : p)
    }));
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingId.current) return;
    e.preventDefault(); 

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const newX = clientX - offset.current.x;
    const newY = clientY - offset.current.y;

    setGameState(prev => {
      const newToilets = prev.toilets.map(t => {
        const dist = Math.sqrt(Math.pow(newX - t.position.x, 2) + Math.pow(newY - t.position.y, 2));
        return { ...t, isOpen: dist < SNAP_THRESHOLD * 1.8 };
      });

      return {
        ...prev,
        toilets: newToilets,
        poops: prev.poops.map(p => p.id === draggingId.current ? { ...p, position: { x: newX, y: newY } } : p)
      };
    });

  }, [gameState.poops]);

  const handleDragEnd = useCallback(() => {
    if (!draggingId.current) return;

    const currentId = draggingId.current;
    const poop = gameState.poops.find(p => p.id === currentId);
    draggingId.current = null;

    if (!poop) return;

    let matchedToilet: ToiletTarget | undefined;
    const toilets = gameState.toilets;
    for (const t of toilets) {
       const dist = Math.sqrt(Math.pow(poop.position.x - t.position.x, 2) + Math.pow(poop.position.y - t.position.y, 2));
       if (dist < SNAP_THRESHOLD) {
         matchedToilet = t;
         break;
       }
    }

    if (matchedToilet) {
      if (matchedToilet.color === poop.color) {
        // Success
        playSplash();
        addEffect(matchedToilet.position.x, matchedToilet.position.y - 50, "SPLASH!", "#3b82f6");
        
        setGameState(prev => ({
          ...prev,
          score: prev.score + 100,
          poops: prev.poops.map(p => p.id === currentId ? { ...p, isFlushed: true, isDragging: false } : p),
          toilets: prev.toilets.map(t => ({...t, isOpen: false}))
        }));
        
        setPoopsFlushed(prev => {
            const newVal = prev + 1;
            if (newVal >= TARGET_SCORE) {
                setGameResult('win');
                setGameState(g => ({ ...g, gameOver: true }));
                setTimeout(() => playWin(), 500);
            }
            return newVal;
        });

      } else {
        // Wrong Toilet
        playFart();
        addEffect(matchedToilet.position.x, matchedToilet.position.y - 60, "NOPE!", "#ef4444");
        triggerBounce(currentId, -80);
        loseLife();
      }
    } else {
      // Dropped on floor
      playFart();
      addEffect(poop.position.x, poop.position.y - 40, "MISS!", "#ef4444");
      setGameState(prev => ({
         ...prev,
         poops: prev.poops.map(p => p.id === currentId ? { ...p, isDragging: false } : p),
         toilets: prev.toilets.map(t => ({...t, isOpen: false}))
      }));
      loseLife();
    }
  }, [gameState.toilets, gameState.poops]);

  const loseLife = () => {
      setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
              setGameResult('lose');
              setGameState(g => ({ ...g, gameOver: true }));
              playLose();
              return 0;
          }
          return newLives;
      });
  };

  const triggerBounce = (id: string, yDelta: number) => {
     setGameState(prev => ({
       ...prev,
       poops: prev.poops.map(p => p.id === id ? { 
         ...p, 
         isDragging: false, 
         shake: true,
         position: { x: p.position.x + randomInt(-30, 30), y: p.position.y + yDelta } 
       } : p),
       toilets: prev.toilets.map(t => ({...t, isOpen: false}))
     }));
     
     setTimeout(() => {
        setGameState(prev => ({
            ...prev,
            poops: prev.poops.map(p => p.id === id ? { ...p, shake: false } : p)
        }));
     }, 300);
  };

  // Global event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);


  // --- RENDER ---

  if (!gameStarted) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white overflow-hidden relative">
        <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce delay-700">💩</div>
        <div className="absolute bottom-20 right-10 text-6xl opacity-20 animate-bounce">💩</div>

        <div className="bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl shadow-2xl max-w-md text-center border-4 border-slate-600 transform hover:scale-105 transition-transform relative z-10">
          <div className="mb-6 relative inline-block">
              <div className="text-8xl mb-2 filter drop-shadow-lg">🕶️</div>
          </div>

          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
            POOP MAFIA
          </h1>
          <p className="text-slate-300 mb-8 font-mono text-sm">GET IT IN THE TOILET OR GET OUT.</p>

          <button 
            onClick={startLevel}
            className="group relative w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl overflow-hidden shadow-[0_5px_0_rgb(29,78,216)] active:shadow-none active:translate-y-1 transition-all"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-2xl font-bold uppercase">Start Shift</span>
            </div>
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-[shine_1s_infinite]"></div>
          </button>
        </div>
        <style>{`@keyframes shine { 100% { left: 200%; } }`}</style>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden touch-none">
      
      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-40">
         <div className="flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 border-b-4 border-blue-200 shadow-lg transform -rotate-1">
                <span className="text-blue-900 font-black text-lg tracking-tight">GOAL: {poopsFlushed} / {TARGET_SCORE}</span>
            </div>
            <div className="flex gap-1">
                {Array.from({length: MAX_LIVES}).map((_, i) => (
                    <span key={i} className={`text-2xl transition-all ${i < lives ? 'opacity-100 scale-100' : 'opacity-20 scale-75 grayscale'}`}>
                        ❤️
                    </span>
                ))}
            </div>
         </div>
         
         <button 
           onClick={startLevel} 
           className="pointer-events-auto bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-xl shadow-lg active:scale-95 transition-all border-b-4 border-slate-900"
         >
           RETRY
         </button>
      </div>

      {/* Game Area */}
      {gameState.toilets.map(toilet => (
        <Toilet key={toilet.id} toilet={toilet} />
      ))}

      {gameState.poops.map(poop => (
        <Poop key={poop.id} poop={poop} onMouseDown={handleDragStart} />
      ))}

      {/* Visual Effects Layer */}
      {gameState.effects.map(effect => (
          <div 
            key={effect.id}
            className="absolute pointer-events-none animate-pop z-50 font-black text-3xl drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]"
            style={{ 
                left: effect.x, 
                top: effect.y,
                color: effect.color,
                textShadow: '2px 2px 0px black'
            }}
          >
            {effect.text}
          </div>
      ))}

      {/* Game Over / Win Modal */}
      {gameState.gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
           <div className={`rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center relative overflow-hidden border-8 ${gameResult === 'win' ? 'bg-white border-yellow-400' : 'bg-red-900 border-red-600'}`}>
              
              {gameResult === 'win' ? (
                <>
                  <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 animate-pulse"></div>
                  <div className="text-8xl mb-4 animate-celebrate filter drop-shadow-lg">🎉</div>
                  
                  <h2 className="text-4xl font-black text-slate-800 mb-6 leading-tight">
                    happy mens' day to my fav mard: <br/>
                    <span className="text-blue-600 text-5xl block mt-2">POOP MAFIA</span>
                  </h2>
                </>
              ) : (
                <>
                   <div className="text-8xl mb-4 animate-bounce">🚷</div>
                   <h2 className="text-6xl font-black text-red-500 mb-4 tracking-tighter">GET OUT!</h2>
                   <p className="text-red-200 text-xl mb-8 font-bold uppercase">You missed too much.</p>
                </>
              )}

              <button 
                onClick={startLevel}
                className={`text-2xl font-black py-4 px-12 rounded-full shadow-[0_5px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all w-full uppercase tracking-wide
                    ${gameResult === 'win' 
                        ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' 
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    }
                `}
              >
                {gameResult === 'win' ? 'Play Again' : 'Try Again'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

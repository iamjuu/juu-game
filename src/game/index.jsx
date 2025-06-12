import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CarImage, Juucoin, Fuel } from '../assets';

const PETROL_CAN_WIDTH = 30;
const PETROL_CAN_HEIGHT = 40;
const PETROL_CAN_SPACING = 700; // Place every 700 units
const PETROL_CAN_START_X = 500; // Start placing from this x-coordinate

const COIN_RADIUS = 30;
const COIN_SPACING = 280; // Place coins every 80 meters (increased spacing for gaps)
const COIN_START_X = 100; // Start placing coins a bit earlier

const HillClimbGame = () => {
  const canvasRef = useRef(null);
  const carImageRef = useRef(null);
  const juucoinImageRef = useRef(null);
  const fuelImageRef = useRef(null);
  const canvasContainerRef = useRef(null);

  const gameStateRef = useRef({
    car: {
      x: 100,
      y: 200,
      width: 180,
      height: 140,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVel: 0,
      onGround: false,
      fuel: 100
    },
    camera: { x: 0, y: 0 },
    terrain: [],
    petrolCans: [],
    gameCoins: [],
    keys: {},
    gameRunning: true,
    distance: 0,
    coins: 0
  });

  const [gameStats, setGameStats] = useState({ distance: 0, fuel: 100, coins: 0 });
  const [gameOver, setGameOver] = useState(false);

  // Generate terrain with flat roads initially, then gradual mountains after 500m
  const generateTerrain = useCallback(() => {
    const terrain = [];
    let y = 350; // Start at a comfortable height
    
    for (let x = 0; x < 5000; x += 20) {
      if (x < 500) {
        // First 500m: Keep mostly flat with very small variations
        y += (Math.random() - 0.5) * 8; // Very small variation (±4 pixels)
        y = Math.max(330, Math.min(370, y)); // Keep within tight bounds
      } else {
        // After 500m: Gradually introduce mountains
        const distanceAfter500 = x - 500;
        const mountainLevel = Math.floor(distanceAfter500 / 800); // New mountain level every 800m
        
        // Gradually increase variation, but keep it reasonable
        const baseVariation = 15 + (mountainLevel * 10); // Start small, increase gradually
        
        // Height bounds that create gentle mountains
        const minHeight = Math.max(250, 350 - (mountainLevel * 30));
        const maxHeight = Math.min(500, 350 + (mountainLevel * 30));
        
        // Apply gentle terrain variation
        y += (Math.random() - 0.5) * baseVariation;
        y = Math.max(minHeight, Math.min(maxHeight, y));
      }
      
      terrain.push({ x, y });
    }
    return terrain;
  }, []);

  // Generate petrol cans
  const generatePetrolCans = useCallback((terrainPoints) => {
    const cans = [];
    if (!terrainPoints || terrainPoints.length === 0) return cans;

    const lastTerrainX = terrainPoints.length > 0 ? terrainPoints[terrainPoints.length - 1].x : PETROL_CAN_START_X;

    for (let currentX = PETROL_CAN_START_X; currentX < lastTerrainX; currentX += PETROL_CAN_SPACING) {
      const terrainY = getTerrainHeight(currentX);
      if (terrainY === undefined || terrainY === null) continue;
      cans.push({
        x: currentX, // center x
        y: terrainY - PETROL_CAN_HEIGHT / 2 - 10, // center y, 10px above ground
        width: PETROL_CAN_WIDTH,
        height: PETROL_CAN_HEIGHT,
        active: true,
      });
    }
    return cans;
  }, []);

  // Generate coins in sets with gaps
  const generateGameCoins = useCallback((terrainPoints) => {
    const coinsArr = [];
    if (!terrainPoints || terrainPoints.length === 0) return coinsArr;

    const lastTerrainX = terrainPoints.length > 0 ? terrainPoints[terrainPoints.length - 1].x : COIN_START_X;
    
    // Define coin sets: [number of coins, gap after set]
    const coinSets = [
      { count: 10, gap: 500 }, // First set: 10 coins, then 500m gap
      { count: 15, gap: 500 }, // Second set: 15 coins, then 500m gap
      { count: 15, gap: 500 }, // Third set: 15 coins, then 500m gap
      { count: 20, gap: 500 }, // Fourth set: 20 coins, then 500m gap
    ];
    
    let currentX = COIN_START_X;
    let setIndex = 0;
    
    while (currentX < lastTerrainX && setIndex < coinSets.length) {
      const currentSet = coinSets[setIndex];
      
      // Place coins for current set
      for (let i = 0; i < currentSet.count && currentX < lastTerrainX; i++) {
        const terrainY = getTerrainHeight(currentX);
        if (terrainY !== undefined && terrainY !== null) {
          coinsArr.push({
            x: currentX,
            y: terrainY - COIN_RADIUS - 20,
            radius: COIN_RADIUS,
            active: true,
            collecting: false,
            animationTime: 0,
            startY: 0
          });
        }
        currentX += COIN_SPACING;
      }
      
      // Add gap after the set
      currentX += currentSet.gap;
      setIndex++;
      
      // If we've used all defined sets, repeat the last pattern
      if (setIndex >= coinSets.length) {
        setIndex = coinSets.length - 1; // Keep using the last set pattern
      }
    }
    
    return coinsArr;
  }, []);

  // Initialize game
  useEffect(() => {
    const newTerrain = generateTerrain();
    gameStateRef.current.terrain = newTerrain;
    gameStateRef.current.petrolCans = generatePetrolCans(newTerrain);
    gameStateRef.current.gameCoins = generateGameCoins(newTerrain);
    
    // Preload car image
    const img = new Image();
    img.src = CarImage;
    img.onload = () => {
      carImageRef.current = img;
    };

    // Preload Juucoin image
    const coinImg = new Image();
    coinImg.src = Juucoin;
    coinImg.onload = () => {
      juucoinImageRef.current = coinImg;
    };

    // Preload Fuel image
    const fuelImg = new Image();
    fuelImg.src = Fuel;
    fuelImg.onload = () => {
      fuelImageRef.current = fuelImg;
    };
  }, [generateTerrain, generatePetrolCans, generateGameCoins]);

  // Get terrain height at x position
  const getTerrainHeight = useCallback((x) => {
    const terrain = gameStateRef.current.terrain;
    
    // Safety check for uninitialized or empty terrain
    if (!terrain || terrain.length === 0) {
      return 300; // Return a default height
    }

    if (x < 0) return terrain[0].y; // Use first point's y for negative x, assuming terrain starts at or after x=0
    
    const index = Math.floor(x / 20); 
    
    if (index < 0) return terrain[0].y; // Should be covered by x < 0 check or if x is small positive
    if (index >= terrain.length - 1) return terrain[terrain.length - 1].y; // Use last point if index is at or beyond the last segment
    
    const t1 = terrain[index];
    const t2 = terrain[index + 1];
    const ratio = (x - t1.x) / (t2.x - t1.x);
    return t1.y + (t2.y - t1.y) * ratio;
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      gameStateRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      gameStateRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game physics and update loop
  const updateGame = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.gameRunning) return;

    const { car, keys, petrolCans, gameCoins } = state;
    const dt = 1/60;

    // Input handling
    if (keys['ArrowRight'] || keys['d']) {
      car.vx += 200 * dt;
      car.fuel = Math.max(0, car.fuel - 10 * dt);
    }
    if (keys['ArrowLeft'] || keys['a']) {
      car.vx -= 100 * dt;
      car.fuel = Math.max(0, car.fuel - 5 * dt);
    }

    // Physics
    car.vy += 500 * dt; // gravity
    car.vx *= 0.995; // friction - reduced for smoother deceleration
    
    // Update position
    car.x += car.vx * dt;
    car.y += car.vy * dt;
    car.angle += car.angularVel * dt;
    car.angularVel *= 0.9;

    // Terrain collision
    const groundHeight = getTerrainHeight(car.x);
    if (car.y + car.height/2 > groundHeight) {
      car.y = groundHeight - car.height/2 + 5; // Added +5 to eliminate gap between car and ground
      car.vy = Math.max(0, car.vy * -0.3);
      car.onGround = true;
      
      // Calculate ground angle for car rotation
      const groundAngle = Math.atan2(
        getTerrainHeight(car.x + 10) - getTerrainHeight(car.x - 10), 
        20
      );
      car.angle = groundAngle * 0.1;
    } else {
      car.onGround = false;
    }

    // Petrol can collision
    const carLeft = car.x - car.width / 2;
    const carRight = car.x + car.width / 2;
    const carTop = car.y - car.height / 2;
    const carBottom = car.y + car.height / 2;

    for (let i = 0; i < petrolCans.length; i++) {
      const can = petrolCans[i];
      if (can.active) {
        const canLeft = can.x - can.width / 2;
        const canRight = can.x + can.width / 2;
        const canTop = can.y - can.height / 2;
        const canBottom = can.y + can.height / 2;

        if (carRight > canLeft && carLeft < canRight && carBottom > canTop && carTop < canBottom) {
          car.fuel = 100; // Reset fuel
          can.active = false; // Deactivate can
          // Optional: Add sound effect or score
          break; // Assume collect one can per frame
        }
      }
    }

    // Coin collision
    for (let i = 0; i < gameCoins.length; i++) {
      const coin = gameCoins[i];
      if (coin.active && !coin.collecting) {
        // Simple AABB collision for car (rectangle) and coin (approximated as square for now)
        const coinLeft = coin.x - coin.radius;
        const coinRight = coin.x + coin.radius;
        const coinTop = coin.y - coin.radius;
        const coinBottom = coin.y + coin.radius;

        if (carRight > coinLeft && carLeft < coinRight && carBottom > coinTop && carTop < coinBottom) {
          state.coins += 1; // Increment coin count
          // Start collection animation
          coin.collecting = true;
          coin.animationTime = 0;
          coin.startY = coin.y;
          // Optional: Add sound effect
          // No break here, car might collect multiple coins if they overlap
        }
      }
    }

    // Update coin animations
    for (let i = 0; i < gameCoins.length; i++) {
      const coin = gameCoins[i];
      if (coin.collecting) {
        coin.animationTime += dt;
        const animationDuration = 1.0; // 1 second animation
        
        if (coin.animationTime >= animationDuration) {
          coin.active = false; // Deactivate coin after animation
          coin.collecting = false;
        } else {
          // Move coin upward during animation
          const progress = coin.animationTime / animationDuration;
          coin.y = coin.startY - (100 * progress); // Move up 100 pixels
        }
      }
    }

    // Camera follows car
    if (canvasRef.current && canvasRef.current.width > 0) {
      state.camera.x = car.x - canvasRef.current.width / 2;
      state.camera.y = Math.max(0, car.y - 200);
    }

    // Update stats
    state.distance = Math.max(state.distance, Math.floor(car.x / 10));
    
    // Game over conditions
    if (car.fuel <= 0 || car.y > 600) {
      state.gameRunning = false;
      setGameOver(true);
    }

    setGameStats({
      distance: state.distance,
      fuel: Math.round(car.fuel),
      coins: state.coins
    });
  }, []);

  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { car, camera, terrain, petrolCans, gameCoins } = gameStateRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw terrain
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, terrain[0].y);
    terrain.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(terrain[terrain.length - 1].x, 600);
    ctx.lineTo(terrain[0].x, 600);
    ctx.closePath();
    ctx.fillStyle = '#8B4513';
    ctx.fill();

    // Draw grass line
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, terrain[0].y);
    terrain.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw petrol cans
    petrolCans.forEach(can => {
      if (can.active) {
        if (fuelImageRef.current) {
          // Draw fuel image
          ctx.drawImage(
            fuelImageRef.current,
            can.x - can.width / 2,
            can.y - can.height / 2,
            can.width,
            can.height
          );
        } else {
          // Fallback to red rectangle if image isn't loaded yet
          ctx.fillStyle = 'red';
          ctx.fillRect(
            can.x - can.width / 2,
            can.y - can.height / 2,
            can.width,
            can.height
          );
        }
      }
    });

    // Draw coins
    gameCoins.forEach(coin => {
      if (coin.active) {
        // Calculate opacity for fade effect during collection animation
        let opacity = 1.0;
        if (coin.collecting) {
          const animationDuration = 1.0;
          const progress = coin.animationTime / animationDuration;
          opacity = 1.0 - progress; // Fade from 1 to 0
        }
        
        ctx.save();
        ctx.globalAlpha = opacity;
        
        if (juucoinImageRef.current) {
          ctx.drawImage(
            juucoinImageRef.current,
            coin.x - 100, // Adjust x to center the 200px width
            coin.y - 100, // Adjust y to center the 200px height
            200,          // Fixed width of 200px
            200           // Fixed height of 200px
          );
        } else {
          // Fallback to drawing a circle if image isn't loaded yet
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'gold'; // Coin color
          ctx.fill();
          ctx.closePath();
        }
        
        ctx.restore();
      }
    });

    // Draw car
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    
    // Flip image if moving left (assuming default image faces right)
    if (car.vx < 0) {
      ctx.scale(-1, 1);
    }
    
    // Draw car image if loaded
    if (carImageRef.current) {
      ctx.drawImage(carImageRef.current, -car.width/2, -car.height/2, car.width, car.height);
    }
    
    ctx.restore();
    ctx.restore();
  }, []);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      updateGame();
      render();
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }, [updateGame, render]);

  // Effect to handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;

    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = 400; // Keep height fixed at 400px, or adjust as needed
      // No explicit re-render call here, game loop will pick up changes
    };

    resizeCanvas(); // Initial resize

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
    };
  }, []); // Empty dependency array, runs once to setup observer

  const restartGame = () => {
    const newTerrain = generateTerrain(); // Generate terrain once
    gameStateRef.current = {
      car: {
        x: 100,
        y: 200,
        width: 180,
        height: 140,
        vx: 0,
        vy: 0,
        angle: 0,
        angularVel: 0,
        onGround: false,
        fuel: 100
      },
      camera: { x: 0, y: 0 },
      terrain: newTerrain,
      petrolCans: generatePetrolCans(newTerrain), // Regenerate petrol cans
      gameCoins: generateGameCoins(newTerrain), // Regenerate coins
      keys: {},
      gameRunning: true,
      distance: 0,
      coins: 0
    };
    setGameOver(false);
    setGameStats({ distance: 0, fuel: 100, coins: 0 });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl w-full">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">Juu Climb Racing</h1>
        
        {/* Game Stats */}
        <div className="flex justify-c items-center mb-4 p-3 bg-gray-50 rounded">
          <div className="flex gap-6">
            <span className="font-semibold">Distance: {gameStats.distance}m</span>
            <span className="font-semibold">Fuel: {gameStats.fuel}%</span>
            <span className="font-semibold">Coins: {gameStats.coins}</span>
          </div>
          <button 
            onClick={restartGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Restart
          </button>
        </div>

        {/* Game Canvas */}
        <div ref={canvasContainerRef} className="relative border-2 w-full border-gray-300 rounded">
          <canvas  
            ref={canvasRef}
          />
          
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="bg-white p-8 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4 text-red-600">Game Over!</h2>
                <p className="mb-4">Distance: {gameStats.distance}m</p>
                <button 
                  onClick={restartGame}
                  className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HillClimbGame;
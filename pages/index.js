import Image from "next/image";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import { useState, useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
});

export default function Home() {
  const [points, setPoints] = useState(0);
  const [chefs, setChefs] = useState(0);
  const [loaves, setLoaves] = useState(0);
  const [jarState, setJarState] = useState(0);
  const [floatingPoints, setFloatingPoints] = useState([]);
  const [starterLevel, setStarterLevel] = useState(1);

  const jarImages = [
    "/JarEmpty.png",
    // "/Jar1.png",
    "/Jar2.png",
    "/Jar3.png",
    "/JarFull.png"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (chefs > 0) {
        setPoints(prev => prev + chefs);
        
        // Add one floating point indicator showing total points from all chefs
        const id = Date.now();
        const xOffset = Math.random() * 40 - 20;
        setFloatingPoints(prev => [...prev, { 
          id, 
          xOffset,
          isChefPoint: true,  // This marks it as a chef point
          value: chefs 
        }]);
        
        setTimeout(() => {
          setFloatingPoints(prev => prev.filter(point => point.id !== id));
        }, 1000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [chefs]);

  const handleJarClick = () => {
    const pointsToAdd = starterLevel;
    setPoints(points + pointsToAdd);
    setJarState((prevState) => (prevState + 1) % jarImages.length);
    
    const id = Date.now();
    const xOffset = Math.random() * 40 - 20;
    setFloatingPoints(prev => [...prev, { 
      id, 
      xOffset,
      value: pointsToAdd
    }]);
    
    setTimeout(() => {
      setFloatingPoints(prev => prev.filter(point => point.id !== id));
    }, 1000);
  };

  const handleBuyChef = () => {
    if (points >= 50) {
      setPoints(points - 50);
      setChefs(chefs + 1);
    }
  };

  const handleBakeLoaf = () => {
    if (points >= 200) {
      setPoints(points - 200);
      setLoaves(loaves + 1);
    }
  };

  const handleUpgradeStarter = () => {
    if (loaves >= 10) {
      setLoaves(loaves - 10);
      setStarterLevel(prev => prev + 1);
    }
  };

  return (
    <div className={`${pressStart2P.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 ${pressStart2P.className}`}>
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
          IDLE SOURDOUGH STARTER
        </h1>
        
        <div className="flex gap-12 p-6 bg-white rounded-xl shadow-md border border-gray-200 mx-auto">
          <div className="flex flex-col items-center">
            <span className="font-bold text-2xl text-blue-600">{points}</span>
            <span className="text-sm font-medium text-gray-700 mt-1">Points</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-2xl text-green-600">{chefs}</span>
            <span className="text-sm font-medium text-gray-700 mt-1">Chefs</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-2xl text-amber-600">{loaves}</span>
            <span className="text-sm font-medium text-gray-700 mt-1">Loaves</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="cursor-pointer hover:scale-105 transition-transform w-[200px] h-[200px] relative" onClick={handleJarClick}>
            <Image
              src={jarImages[jarState]}
              alt="Clickable Jar"
              width={200}
              height={200}
              priority
              style={{
                objectFit: 'contain',
                width: '100%',
                height: '100%',
                maxWidth: '160px',
                margin: '0 auto'
              }}
            />
            {floatingPoints.map(point => !point.isChefPoint && (
              <div
                key={point.id}
                className="absolute top-0 left-1/2 text-green-600 font-bold pointer-events-none animate-float-up"
                style={{
                  transform: `translateX(${point.xOffset}px)`,
                }}
              >
                +{point.value || 1}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col items-center gap-4 relative">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">Buy a Chef</h2>
                <div className="group relative">
                  <button className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm hover:bg-gray-300">
                    i
                  </button>
                  <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg">
                    Chefs cost 50 points each. Every chef automatically generates 1 point every 5 seconds without clicking.
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-[100px] h-[100px] relative">
                <Image
                  src="/chef.png"
                  alt="Chef"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button 
                onClick={handleBuyChef}
                disabled={points < 50}
                className={`px-4 py-2 rounded-lg font-medium transition-colors
                  ${points >= 50 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Buy (50 points)
              </button>

              {floatingPoints.map(point => point.isChefPoint && (
                <div
                  key={point.id}
                  className="absolute top-1/2 left-1/2 text-green-600 font-bold pointer-events-none animate-float-up"
                  style={{
                    transform: `translateX(${point.xOffset}px)`,
                  }}
                >
                  +{chefs}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">Bake a Loaf</h2>
                <div className="group relative">
                  <button className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm hover:bg-gray-300">
                    i
                  </button>
                  <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg">
                    Bake a fresh sourdough loaf for 200 points. Each loaf you bake helps you perfect your recipe, and once you have made 10 loaves, you can upgrade your starter and get more points for feeding it!
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-[100px] h-[100px] relative">
                <Image
                  src="/loaf.png"
                  alt="Sourdough Loaf"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button 
                onClick={handleBakeLoaf}
                disabled={points < 200}
                className={`px-4 py-2 rounded-lg font-medium transition-colors
                  ${points >= 200 
                    ? 'bg-amber-600 text-white hover:bg-amber-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Bake (200 points)
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">Upgrade Starter</h2>
                <div className="group relative">
                  <button className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm hover:bg-gray-300">
                    i
                  </button>
                  <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg">
                    Upgrade your starter for 10 loaves. Each upgrade increases points per click by 1. Current level: {starterLevel}
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-[100px] h-[100px] relative">
                <Image
                  src="/upgrade.png"
                  alt="Starter Upgrade"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button 
                onClick={handleUpgradeStarter}
                disabled={loaves < 10}
                className={`px-4 py-2 rounded-lg font-medium transition-colors
                  ${loaves >= 10 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Upgrade (10 loaves)
              </button>
            </div>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      
      </footer>
    </div>
  );
}

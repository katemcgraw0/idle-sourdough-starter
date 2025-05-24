import Image from "next/image";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import { useState, useEffect } from "react";
import { supabase } from '../supabaseClient'

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
  const [starterLevel, setStarterLevel] = useState(1);
  const [jarState, setJarState] = useState(0);
  const [floatingPoints, setFloatingPoints] = useState([]);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sourdoughUserId') || "";
    }
    return "";
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [hiringManagers, setHiringManagers] = useState(0);
  const [bakers, setBakers] = useState(0);
  const [cinnamonLoaves, setCinnamonLoaves] = useState(0);
  const [sourdoughStands, setSourdoughStands] = useState(0);

  // Update localStorage when userId changes
  useEffect(() => {
    if (userId) {
      localStorage.setItem('sourdoughUserId', userId);
    }
  }, [userId]);

  // Load saved state
  const loadSavedState = async (id) => {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', parseInt(id))
      .single();

    if (error) {
      console.error('Error loading saved state:', error);
      return;
    }

    if (data) {
      setPoints(data.points);
      setChefs(data.chefs);
      setLoaves(data.loaves);
      setCinnamonLoaves(data.cinnamon_loaves || 0);
      setHiringManagers(data.hiring_managers || 0);
      setBakers(data.bakers || 0);
      setStarterLevel(data.starter_level);
      setUsername(data.username);
      setUserId(data.user_id);
      setSourdoughStands(data.sourdough_stands || 0);
    }
  };

  // Handle restore progress
  const handleRestore = async (e) => {
    e.preventDefault();
    if (!userId) return;
    await loadSavedState(userId);
  };

  // Handle save to leaderboard
  const handleSaveToLeaderboard = async () => {
    if (!username) {
      setSaveMessage("Please enter a username first!");
      return;
    }

    try {
      const saveUserId = userId || Math.floor(100000 + Math.random() * 900000);
      
      const { error } = await supabase
        .from('leaderboard')
        .upsert({ 
          user_id: saveUserId,
          username,
          points,
          chefs,
          loaves,
          cinnamon_loaves: cinnamonLoaves,
          hiring_managers: hiringManagers,
          bakers,
          starter_level: starterLevel,
          sourdough_stands: sourdoughStands,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      // Fetch updated leaderboard
      const { data: updatedLeaderboard, error: fetchError } = await supabase
        .from('leaderboard')
        .select('*')
        .order('starter_level', { ascending: false })
        .order('bakers', { ascending: false })
        .order('hiring_managers', { ascending: false })
        .order('cinnamon_loaves', { ascending: false })
        .order('loaves', { ascending: false })
        .order('chefs', { ascending: false })
        .order('points', { ascending: false })
        .limit(10);

      if (!fetchError && updatedLeaderboard) {
        setLeaderboard(updatedLeaderboard);
      }
      
      if (!userId) {
        setUserId(saveUserId);
        setSaveMessage(`Game saved! Your ID is: ${saveUserId}. Save this to restore your progress later!`);
      } else {
        setSaveMessage(`Game progress updated! (Your ID is: ${userId})`);
      }
      setShowSaveModal(true);
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Failed to save score:', error);
      setSaveMessage("Failed to save. Please try again.");
    }
  };

  // Load leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('starter_level', { ascending: false })
        .order('bakers', { ascending: false })
        .order('hiring_managers', { ascending: false })
        .order('cinnamon_loaves', { ascending: false })
        .order('loaves', { ascending: false })
        .order('chefs', { ascending: false })
        .order('points', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      setLeaderboard(data);
    };

    fetchLeaderboard();
    
    // Set up real-time subscription
    const leaderboardSubscription = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leaderboard' }, 
        fetchLeaderboard
      )
      .subscribe();

    return () => {
      leaderboardSubscription.unsubscribe();
    };
  }, []);

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

  // Add a function to calculate chef cost
  const calculateChefCost = (currentChefs) => {
    return Math.floor(50 * Math.pow(1.2, currentChefs));
  };

  // Update the chef purchase button
  const handleBuyChef = () => {
    const cost = calculateChefCost(chefs);
    if (points >= cost) {
      setPoints(points - cost);
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

  // Update the hiring manager automation
  useEffect(() => {
    const interval = setInterval(() => {
      if (hiringManagers > 0) {
        setPoints(prev => {
          let remainingPoints = prev;
          let chefsToAdd = 0;
          
          // Try to hire as many chefs as we can afford with current managers
          for (let i = 0; i < hiringManagers; i++) {
            const nextChefCost = calculateChefCost(chefs + chefsToAdd);
            if (remainingPoints >= nextChefCost) {
              remainingPoints -= nextChefCost;
              chefsToAdd++;
            } else {
              break;
            }
          }

          if (chefsToAdd > 0) {
            setChefs(prevChefs => prevChefs + chefsToAdd);
            return remainingPoints;
          }
          return prev;
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [hiringManagers, chefs]);

  // Update the chef card tooltip
  const handleBuyHiringManager = () => {
    if (points >= 10000) {
      setPoints(points - 10000);
      setHiringManagers(hiringManagers + 1);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (bakers > 0) {
        setLoaves(prevLoaves => prevLoaves + bakers);
      }
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [bakers]);

  // Update cost calculation function
  const calculateStandCost = (currentStands) => {
    return {
      managers: Math.floor(2 * Math.pow(2, currentStands)),
      bakers: Math.floor(20 * Math.pow(2, currentStands)),
      starterLevels: 100
    };
  };

  return (
    <div className={`${pressStart2P.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 ${pressStart2P.className}`}>
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            IDLE SOURDOUGH STARTER
          </h1>
          <p className="text-sm text-gray-600">
            Feed (Click) Your Starter to earn points!
          </p>
        </div>
        
        <div className="flex gap-4 sm:gap-12 p-4 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200 mx-auto">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg sm:text-2xl text-blue-600">{points}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1">Points</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg sm:text-2xl text-green-600">{chefs}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1">Chefs</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg sm:text-2xl text-amber-600">{loaves}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1">Loaves</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg sm:text-2xl text-orange-600">{cinnamonLoaves}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1">Twists</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg sm:text-2xl text-blue-600">{hiringManagers}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1">Managers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg sm:text-2xl text-red-600">{bakers}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1">Bakers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg sm:text-2xl text-purple-600">{starterLevel}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1">Lvl</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg sm:text-2xl text-yellow-600">{sourdoughStands}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1">Stands</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="cursor-pointer hover:scale-105 transition-transform w-[400px] h-[400px] relative" onClick={handleJarClick}>
            <Image
              src={jarImages[jarState]}
              alt="Clickable Jar"
              width={300}
              height={300}
              priority
              style={{
                objectFit: 'contain',
                width: '100%',
                height: '100%',
                maxWidth: '200px',
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">Chef</h2>
                <div className="group relative">
                  <button className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs hover:bg-gray-300">
                    i
                  </button>
                  <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
                    Hire chefs to automatically make points. Each chef costs 20% more than the previous chef.
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-12 h-12 relative">
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
                disabled={points < calculateChefCost(chefs)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors w-full text-center
                  ${points >= calculateChefCost(chefs)
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Hire ({calculateChefCost(chefs)} points)
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

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">Bake a Loaf</h2>
                <div className="group relative">
                  <button className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs hover:bg-gray-300">
                    i
                  </button>
                  <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
                    Bake a fresh sourdough loaf for 200 points. Each loaf you bake helps you perfect your recipe, and once you have made 10 loaves, you can upgrade your starter and get more points for feeding it!
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-12 h-12 relative">
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
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors w-full text-center
                  ${points >= 200 
                    ? 'bg-amber-600 text-white hover:bg-amber-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Bake (200 points)
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">Cinnamon Twist</h2>
                <div className="group relative">
                  <button className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs hover:bg-gray-300">
                    i
                  </button>
                  <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
                    Spend 2000 points to make a special cinnamon twist loaf.
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-12 h-12 relative">
                <Image
                  src="/cinnamon_loaves.png"
                  alt="Cinnamon Twist Loaf"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button 
                onClick={() => {
                  if (points >= 2000) {
                    setPoints(points - 2000);
                    setCinnamonLoaves(cinnamonLoaves + 1);
                  }
                }}
                disabled={points < 2000}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors w-full text-center
                  ${points >= 2000 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Make (2000 points)
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">Hire Manager</h2>
                <div className="group relative">
                  <button className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs hover:bg-gray-300">
                    i
                  </button>
                  <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
                    Hiring Managers cost 10000 points. Each manager automatically tries to hire a new chef every 30 seconds if you have enough points (cost doubles with each chef).
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-12 h-12 relative">
                <Image
                  src="/hiring_manager.png"
                  alt="Hiring Manager"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button 
                onClick={handleBuyHiringManager}
                disabled={points < 10000}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors w-full text-center
                  ${points >= 10000 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Buy (10000 points)
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">Baker</h2>
                <div className="group relative">
                  <button className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs hover:bg-gray-300">
                    i
                  </button>
                  <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
                    Trade 500 chefs for a baker. Each baker automatically makes a loaf every 20 seconds.
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-12 h-12 relative">
                <Image
                  src="/baker.png"
                  alt="Baker"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button 
                onClick={() => {
                  if (chefs >= 500) {
                    setChefs(chefs - 500);
                    setBakers(bakers + 1);
                  }
                }}
                disabled={chefs < 500}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors w-full text-center
                  ${chefs >= 500 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Trade (500 chefs)
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">Upgrade Starter</h2>
                <div className="group relative">
                  <button className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs hover:bg-gray-300">
                    i
                  </button>
                  <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
                    Level up your starter by trading 10 loaves and 5 cinnamon twists. Higher level starters earn more points per click.
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-12 h-12 relative">
                <Image
                  src="/upgrade.png"
                  alt="Sourdough Starter"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button 
                onClick={() => {
                  if (loaves >= 10 && cinnamonLoaves >= 5) {
                    setLoaves(loaves - 10);
                    setCinnamonLoaves(cinnamonLoaves - 5);
                    setStarterLevel(starterLevel + 1);
                  }
                }}
                disabled={loaves < 10 || cinnamonLoaves < 5}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors w-full text-center
                  ${loaves >= 10 && cinnamonLoaves >= 5
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Upgrade (10 Loaves + 5 Twists)
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">Sourdough Stand</h2>
                <div className="group relative">
                  <button className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs hover:bg-gray-300">
                    i
                  </button>
                  <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
                    Open a sourdough stand. Requires managers, bakers, and starter level sacrifice. Each stand costs double the previous one.
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-12 h-12 relative">
                <Image
                  src="/sourdoughStand.png"
                  alt="Sourdough Stand"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button 
                onClick={() => {
                  const cost = calculateStandCost(sourdoughStands);
                  if (hiringManagers >= cost.managers && 
                      bakers >= cost.bakers && 
                      starterLevel >= cost.starterLevels) {
                    setHiringManagers(hiringManagers - cost.managers);
                    setBakers(bakers - cost.bakers);
                    setStarterLevel(starterLevel - cost.starterLevels);
                    setSourdoughStands(sourdoughStands + 1);
                  }
                }}
                disabled={
                  hiringManagers < calculateStandCost(sourdoughStands).managers ||
                  bakers < calculateStandCost(sourdoughStands).bakers ||
                  starterLevel < calculateStandCost(sourdoughStands).starterLevels
                }
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors w-full text-center
                  ${(hiringManagers >= calculateStandCost(sourdoughStands).managers &&
                     bakers >= calculateStandCost(sourdoughStands).bakers &&
                     starterLevel >= calculateStandCost(sourdoughStands).starterLevels)
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Open ({calculateStandCost(sourdoughStands).managers} managers, {calculateStandCost(sourdoughStands).bakers} bakers, {calculateStandCost(sourdoughStands).starterLevels} lvls)
              </button>
            </div>
          </div>
        </div>

        {/* Save/Restore UI */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {/* Restore Progress Form */}
          <form onSubmit={handleRestore} className="flex gap-2">
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your ID"
              className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Restore Progress
            </button>
          </form>

          {/* Save to Leaderboard UI */}
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveToLeaderboard}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Save to Leaderboard
            </button>
          </div>

          {/* Save Message Modal */}
          {showSaveModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-md">
                <p className="text-center mb-4">{saveMessage}</p>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          )}

          {/* Leaderboard Toggle */}
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="text-blue-600 hover:underline"
          >
            {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
          </button>

          {/* Leaderboard Display */}
          {showLeaderboard && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 w-full max-w-5xl">
              <h2 className="text-xl font-bold mb-4 text-center">Leaderboard</h2>
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={entry.user_id} 
                    className={`flex flex-col sm:flex-row justify-between items-center p-2 sm:p-3 rounded-lg transition-colors
                      ${index === 0 ? 'bg-amber-50' : 
                        index === 1 ? 'bg-gray-50' : 
                        index === 2 ? 'bg-orange-50' : 
                        'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start mb-2 sm:mb-0">
                      <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[8px]
                        ${index === 0 ? 'bg-amber-200 text-amber-800' :
                          index === 1 ? 'bg-gray-200 text-gray-800' :
                          index === 2 ? 'bg-orange-200 text-orange-800' :
                          'bg-gray-100 text-gray-600'}`}
                      >
                        {index + 1}
                      </span>
                      <div className="group relative">
                        <span className="text-[8px] sm:text-xs truncate max-w-[150px] block">
                          {entry.username}
                        </span>
                        {entry.username.length > 15 && (
                          <div className="invisible group-hover:visible absolute left-0 -top-6 bg-gray-800 text-white text-[8px] rounded px-2 py-1 whitespace-nowrap z-10">
                            {entry.username}
                            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:flex gap-2 sm:gap-4 text-[8px] w-full sm:w-auto">
                      <div className="flex flex-col items-center sm:items-end">
                        <span className="text-yellow-600">{entry.sourdough_stands || 0}</span>
                        <span className="text-gray-500 text-[6px]">stands</span>
                      </div>
                      <div className="flex flex-col items-center sm:items-end">
                        <span className="text-purple-600">Lvl {entry.starter_level}</span>
                        <span className="text-gray-500 text-[6px]">starter</span>
                      </div>
                      <div className="flex flex-col items-center sm:items-end">
                        <span className="text-red-600">{entry.bakers}</span>
                        <span className="text-gray-500 text-[6px]">bakers</span>
                      </div>
                      <div className="flex flex-col items-center sm:items-end">
                        <span className="text-blue-600">{entry.hiring_managers}</span>
                        <span className="text-gray-500 text-[6px]">mgrs</span>
                      </div>
                      <div className="flex flex-col items-center sm:items-end">
                        <span className="text-orange-600">{entry.cinnamon_loaves}</span>
                        <span className="text-gray-500 text-[6px]">twists</span>
                      </div>
                      <div className="flex flex-col items-center sm:items-end">
                        <span className="text-amber-600">{entry.loaves}</span>
                        <span className="text-gray-500 text-[6px]">loaves</span>
                      </div>
                      <div className="flex flex-col items-center sm:items-end">
                        <span className="text-green-600">{entry.chefs}</span>
                        <span className="text-gray-500 text-[6px]">chefs</span>
                      </div>
                      <div className="flex flex-col items-center sm:items-end">
                        <span className="text-blue-600">{entry.points}</span>
                        <span className="text-gray-500 text-[6px]">points</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <p className="text-gray-400 text-sm">
          Happy Graduation Patty, love Kate
        </p>
      </footer>
    </div>
  );
}

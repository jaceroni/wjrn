import { useState, useEffect, useRef } from "react";
import { RadioConfig, Station } from "./types";
import AudioVisualizer from "./components/AudioVisualizer";
import TwitchSchedule from "./components/TwitchScheduleRetro";
import NebulaHomepage from "./components/NebulaHomepage";
import { usePlayer } from "./context/PlayerContext";

// Import generated premium assets
import bgImage from "./assets/images/wjrn-bg.jpg";
import dialRockGarden from "./assets/images/dial-logos-trg.png";
import dialBridgeCity from "./assets/images/dial-logos-bchs.png";
import dialGoldenBoombox from "./assets/images/dial-logos-gbs.png";
import wjrnLogo from "./assets/images/wjrn-logo.svg";

// Setup stable static structures
const STATIONS: Station[] = [
  {
    id: "wjrn",
    name: "WJRN",
    subtitle: "",
    genre: "INSTRUMENTAL FUNK, JAZZ, SOUL",
    description: "Lurk and work soundtrack",
    logoUrl: wjrnLogo,
    streamUrl: "https://radio.jacewonmusic.com/listen/wjrn/radio.mp3",
    shortcode: "wjrn",
    showUrl: "/"
  },
  {
    id: "rock_garden",
    name: "THE ROCK GARDEN",
    subtitle: "",
    genre: "CLASSIC ROCK, FUNK, BLUES, JAZZ",
    description: "",
    logoUrl: dialRockGarden,
    streamUrl: "https://radio.jacewonmusic.com/listen/the_rock_garden/radio.mp3",
    shortcode: "the_rock_garden",
    showUrl: "https://therockgarden.tv"
  },
  {
    id: "bridge_city",
    name: "BRIDGE CITY HANG SUITE",
    subtitle: "",
    genre: "GROWNFOLK R&B, SOUL, ELECTRONICA",
    description: "",
    logoUrl: dialBridgeCity,
    streamUrl: "https://radio.jacewonmusic.com/listen/bridge_city_hang_suite/radio.mp3",
    shortcode: "bridge_city_hang_suite",
    showUrl: "https://jacewonmusic.com"
  },
  {
    id: "golden_boombox",
    name: "THE GOLDEN BOOMBOX",
    subtitle: "",
    genre: "GOLDEN ERA & FUTURE CLASSIC HIP-HOP",
    description: "",
    logoUrl: dialGoldenBoombox,
    streamUrl: "https://radio.jacewonmusic.com/listen/golden_boombox_sessions/radio.mp3",
    shortcode: "golden_boombox_sessions",
    showUrl: "https://jacewonmusic.com"
  }
];

// Fallback tracks when Azuracast is offline or still resolving cross-domain APIs
const MOCK_PLAYLISTS: { [key: string]: Array<{ title: string; artist: string; album: string; nextTitle: string; nextArtist: string }> } = {
  wjrn: [
    { title: "Lurk & Work Session", artist: "WJRN", album: "Instrumental Funk", nextTitle: "Late Night Groove", nextArtist: "WJRN" }
  ],
  rock_garden: [
    { title: "Riders on the Storm", artist: "The Doors", album: "L.A. Woman", nextTitle: "Sunshine of Your Love", nextArtist: "Cream" },
    { title: "Whole Lotta Love", artist: "Led Zeppelin", album: "Led Zeppelin II", nextTitle: "Purple Haze", nextArtist: "Jimi Hendrix" },
    { title: "Superstition", artist: "Stevie Wonder", album: "Talking Book", nextTitle: "Feelin' Alright", nextArtist: "Joe Cocker" },
    { title: "Sultans of Swing", artist: "Dire Straits", album: "Dire Straits", nextTitle: "Gimme Shelter", nextArtist: "The Rolling Stones" }
  ],
  bridge_city: [
    { title: "Find Your Way back", artist: "Kem", album: "Album II", nextTitle: "Prototype", nextArtist: "Outkast" },
    { title: "Golden", artist: "Jill Scott", album: "Beautifully Human", nextTitle: "If I Ain't Got You", nextArtist: "Alicia Keys" },
    { title: "Untitled (How Does It Feel)", artist: "D'Angelo", album: "Voodoo", nextTitle: "On & On", nextArtist: "Erykah Badu" },
    { title: "Adorn", artist: "Miguel", album: "Kaleidoscope Dream", nextTitle: "What You Don't Do", nextArtist: "Lianne La Havas" }
  ],
  golden_boombox: [
    { title: "C.R.E.A.M.", artist: "Wu-Tang Clan", album: "Enter the Wu-Tang", nextTitle: "N.Y. State of Mind", nextArtist: "Nas" },
    { title: "Juicy", artist: "The Notorious B.I.G.", album: "Ready to Die", nextTitle: "The Next Episode", nextArtist: "Dr. Dre" },
    { title: "Mass Appeal", artist: "Gang Starr", album: "Hard to Earn", nextTitle: "Electric Relaxation", nextArtist: "A Tribe Called Quest" },
    { title: "Passin' Me By", artist: "The Pharcyde", album: "Bizarre Ride II the Pharcyde", nextTitle: "Resurrection", nextArtist: "Common" }
  ]
};

// Initial Config
const STORAGE_KEY = "wjrn_broadcasting_config";
const DEFAULT_CONFIG: RadioConfig = {
  azuracastHost: "https://radio.jacewonmusic.com",
  twitchChannel: "jacewonmusic",
  twitchLiveSchedule: "LIVE on Twitch.tv Tues, Weds, & Fridays @ 7PM Pacific",
  stations: {
    wjrn: {
      streamUrl: "https://radio.jacewonmusic.com/listen/wjrn/radio.mp3",
      shortcode: "wjrn"
    },
    rock_garden: {
      streamUrl: "https://radio.jacewonmusic.com/listen/the_rock_garden/radio.mp3",
      shortcode: "the_rock_garden"
    },
    bridge_city: {
      streamUrl: "https://radio.jacewonmusic.com/listen/bridge_city_hang_suite/radio.mp3",
      shortcode: "bridge_city_hang_suite"
    },
    golden_boombox: {
      streamUrl: "https://radio.jacewonmusic.com/listen/golden_boombox_sessions/radio.mp3",
      shortcode: "golden_boombox_sessions"
    }
  }
};

export default function App() {
  // Consume global audio player state from context
  const {
    activeStationId,
    setActiveStationId,
    audioState,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    metadata,
    toggleStation,
    audioRef,
  } = usePlayer();

  // Load configuration from local storage or defaults
  const [currentConfig, setCurrentConfig] = useState<RadioConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not read custom system config from localStorage:", e);
    }
    return DEFAULT_CONFIG;
  });

  const [visualizerType, setVisualizerType] = useState<"bars" | "wave" | "retro">("bars");
  const [utcTime, setUtcTime] = useState("");

  // DOM Refs for direct styling to avoid high-frequency React re-renders
  const bgRef = useRef<HTMLDivElement>(null);
  const displacementRef = useRef<SVGFeDisplacementMapElement>(null);

  // Animation values tracked in refs
  const targetMouse = useRef({ x: 0, y: 0 });
  const currentMouse = useRef({ x: 0, y: 0 });
  const scaleTarget = useRef(0);
  const scaleCurrent = useRef(0);
  const hoverTarget = useRef(0);
  const hoverCurrent = useRef(0);

  const lastMousePos = useRef({ x: 0, y: 0, time: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    // Track target mouse position
    targetMouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;

    // Calculate mouse speed for dynamic liquify distortion scale
    const now = performance.now();
    const dt = now - lastMousePos.current.time;
    if (dt > 10) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist / dt; // px/ms
      
      // Target scale spikes on fast motion, capped at 35 (subtle, non-spazzy)
      const targetScale = Math.min(speed * 12, 35);
      
      // Update target scale
      scaleTarget.current = targetScale;
      lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
    }
  };

  // Smoothly update, decay, and interpolate the liquify distortion and position coordinates
  useEffect(() => {
    let animId: number;
    
    const updateAnimation = () => {
      // 1. Interpolate mouse coordinates (smooth lag/lerp effect)
      currentMouse.current.x += (targetMouse.current.x - currentMouse.current.x) * 0.08;
      currentMouse.current.y += (targetMouse.current.y - currentMouse.current.y) * 0.08;

      // 2. Interpolate hover transition (fades background movement/filter in and out)
      hoverCurrent.current += (hoverTarget.current - hoverCurrent.current) * 0.08;

      // 3. Slower decay of the target scale when movement stops
      scaleTarget.current *= 0.92;
      if (scaleTarget.current < 0.1) scaleTarget.current = 0;

      // Lerp current scale towards target scale
      scaleCurrent.current += (scaleTarget.current - scaleCurrent.current) * 0.1;
      if (scaleCurrent.current < 0.01) scaleCurrent.current = 0;

      // 4. Calculate actual values based on the transition factor
      // When hoverCurrent is 1.0 (hovering card), effect multiplier is 0 (neutral settings)
      const effectMultiplier = 1 - hoverCurrent.current;

      const renderedX = currentMouse.current.x * 12 * effectMultiplier;
      const renderedY = currentMouse.current.y * 12 * effectMultiplier;
      const renderedScale = scaleCurrent.current * effectMultiplier;
      const renderedHue = currentMouse.current.x * 25 * effectMultiplier;
      const renderedSat = 1.0 + Math.abs(currentMouse.current.y) * 0.25 * effectMultiplier;

      // 5. Direct DOM manipulation for maximum smoothness and 0 virtual DOM updates
      if (bgRef.current) {
        bgRef.current.style.transform = `scale(1.05) translate(${renderedX}px, ${renderedY}px)`;
        bgRef.current.style.filter = `url(#liquify) hue-rotate(${renderedHue}deg) saturate(${renderedSat})`;
      }

      if (displacementRef.current) {
        displacementRef.current.setAttribute("scale", String(renderedScale));
      }

      animId = requestAnimationFrame(updateAnimation);
    };

    animId = requestAnimationFrame(updateAnimation);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Studio clock update (displays Pacific Time Zone with proper daylight savings)
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      };
      
      const formatter = new Intl.DateTimeFormat("en-US", options);
      const parts = formatter.formatToParts(d);
      
      const year = parts.find(p => p.type === "year")?.value;
      const month = parts.find(p => p.type === "month")?.value;
      const day = parts.find(p => p.type === "day")?.value;
      const hour = parts.find(p => p.type === "hour")?.value;
      const minute = parts.find(p => p.type === "minute")?.value;
      const second = parts.find(p => p.type === "second")?.value;
      
      // Determine time zone name (PDT or PST)
      const tzOptions: Intl.DateTimeFormatOptions = {
        timeZone: "America/Los_Angeles",
        timeZoneName: "short"
      };
      const tzParts = new Intl.DateTimeFormat("en-US", tzOptions).formatToParts(d);
      const tzName = tzParts.find(p => p.type === "timeZoneName")?.value || "PT";

      setUtcTime(`${year}-${month}-${day} ${hour}:${minute}:${second} ${tzName}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save new configuration inputs
  const handleSaveConfig = (newConfig: RadioConfig) => {
    setCurrentConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error("Could not write config adjustments:", e);
    }
  };

  // Cycle visualizer styling on card click
  const cycleVisualizer = () => {
    setVisualizerType(prev => {
      if (prev === "bars") return "wave";
      if (prev === "wave") return "retro";
      return "bars";
    });
  };

  return (
    <NebulaHomepage
      STATIONS={STATIONS}
      activeStationId={activeStationId}
      setActiveStationId={setActiveStationId}
      toggleStation={toggleStation}
      audioState={audioState}
      volume={volume}
      setVolume={setVolume}
      isMuted={isMuted}
      setIsMuted={setIsMuted}
      metadata={metadata}
      utcTime={utcTime}
      currentConfig={currentConfig}
      visualizerType={visualizerType}
      setVisualizerType={setVisualizerType}
      onToggleView={() => {}}
      audioRef={audioRef}
    />
  );
}

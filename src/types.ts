export interface Station {
  id: string;
  name: string;
  subtitle: string;
  genre: string;
  description: string;
  logoUrl: string;
  streamUrl: string;
  shortcode: string;
  showUrl: string;
}

export interface NowPlaying {
  trackTitle: string;
  trackArtist: string;
  album: string;
  artUrl: string;
  listeners: number;
  isPlayingLive: boolean; // True if a human DJ is streaming live, false for AutoDJ
  isOnline: boolean;      // True if the station is currently online
  nextTrack: {
    title: string;
    artist: string;
  } | null;
}

export interface BroadcastSlot {
  day: string;
  time: string;
  event: string;
}

export interface RadioConfig {
  azuracastHost: string;
  twitchChannel: string;
  twitchLiveSchedule: string; // e.g., "Tuesdays, Weds, and Fridays @ 7PM Pacific"
  stations: {
    [key: string]: {
      streamUrl: string;
      shortcode: string;
    };
  };
}

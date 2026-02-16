export interface MediaItem {
  title: string;
  src: string;
  poster?: string;
  artist?: string;
  artwork?: string;
}

export const DEMO_VIDEO: MediaItem = {
  title: "Sprite Fight",
  src: "https://files.vidstack.io/sprite-fight/720p.mp4",
  poster: "https://files.vidstack.io/sprite-fight/poster.webp",
};

export const DEMO_HLS: MediaItem = {
  title: "Sprite Fight (HLS)",
  src: "https://files.vidstack.io/sprite-fight/hls/stream.m3u8",
  poster: "https://files.vidstack.io/sprite-fight/poster.webp",
};

export const DEMO_AUDIO: MediaItem = {
  title: "Serenity",
  artist: "SoundHelix",
  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
};

export interface MediaItem {
  title: string;
  src: string;
  poster?: string;
  artist?: string;
  artwork?: string;
  thumbnails?: string;
  captions?: string;
}

export const DEMO_VIDEO: MediaItem = {
  title: "Sprite Fight",
  src: "https://files.vidstack.io/sprite-fight/720p.mp4",
  poster: "https://files.vidstack.io/sprite-fight/poster.webp",
  thumbnails: "https://files.vidstack.io/sprite-fight/thumbnails.vtt",
  captions: "https://files.vidstack.io/sprite-fight/subs/english.vtt",
};

export const DEMO_HLS: MediaItem = {
  title: "Sprite Fight (HLS)",
  src: "https://files.vidstack.io/sprite-fight/hls/stream.m3u8",
  poster: "https://files.vidstack.io/sprite-fight/poster.webp",
  thumbnails: "https://files.vidstack.io/sprite-fight/thumbnails.vtt",
  captions: "https://files.vidstack.io/sprite-fight/subs/english.vtt",
};

export const DEMO_AUDIO: MediaItem = {
  title: "Serenity",
  artist: "SoundHelix",
  artwork:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80",
  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
};

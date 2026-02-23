import "@vidstack/react/player/styles/base.css";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEMO_HLS, DEMO_VIDEO } from "../lib/media-data";
import { AudioShowcase } from "./audio-showcase";
import { VideoPlayer } from "./video-player";

export function MediaPlayerDemo() {
  return (
    <div className="container flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-2xl tracking-tight">Media Player</h1>
        <p className="text-muted-foreground text-sm">
          A custom media player built with Vidstack headless components and
          styled with Tailwind CSS.
        </p>
      </div>
      <Tabs defaultValue="video">
        <TabsList>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="hls">HLS</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>
        <TabsContent className="pt-4" value="video">
          <VideoPlayer {...DEMO_VIDEO} />
        </TabsContent>
        <TabsContent className="pt-4" value="hls">
          <VideoPlayer {...DEMO_HLS} />
        </TabsContent>
        <TabsContent className="pt-4" value="audio">
          <AudioShowcase />
        </TabsContent>
      </Tabs>
    </div>
  );
}

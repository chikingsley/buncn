import { MediaPlayerDemo } from "@/app/media-player/components/media-player-demo";
import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/use-mounted";

export function MediaPlayerPage() {
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="container flex flex-col gap-6 py-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="aspect-video w-full rounded-lg" />
      </div>
    );
  }

  return <MediaPlayerDemo />;
}

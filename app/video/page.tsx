import { Suspense } from "react";
import Video from "./video-client";

export default function VideoPage() {
  return (
    <Suspense fallback={null}>
      <Video />
    </Suspense>
  );
}

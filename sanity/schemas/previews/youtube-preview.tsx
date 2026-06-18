import type { PreviewProps } from "sanity";
import { Flex, Text } from "@sanity/ui";
import { SquarePlay } from "lucide-react";

export function YouTubePreview(props: PreviewProps) {
  const { title: videoId } = props;

  return (
    <Flex padding={3} align="center" justify="center">
      {typeof videoId === "string" ? (
        // Plain iframe (matches how the app embeds YouTube everywhere else) —
        // avoids carrying the heavy react-player dependency just for this
        // Studio preview.
        <iframe
          width="100%"
          height="320"
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title="YouTube video preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 0, aspectRatio: "16 / 9" }}
        />
      ) : (
        <Flex align="center" justify="center">
          <SquarePlay />
          <Text>Add a YouTube Video ID</Text>
        </Flex>
      )}
    </Flex>
  );
}

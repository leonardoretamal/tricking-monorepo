import { videosResponseSchema, type VideosResponse } from './video-schemas';

export async function fetchTrickVideos(
  trickId: string,
  signal?: AbortSignal,
): Promise<VideosResponse> {
  const params = new URLSearchParams({ trickId });

  const response = await fetch(`/api/videos?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`videos_request_failed_${response.status}`);
  }

  return videosResponseSchema.parse(await response.json());
}

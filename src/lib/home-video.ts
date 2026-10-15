/**
 * URL the homepage player streams the film from: the range-capable /film route
 * (src/app/film/[file]/route.ts), which Safari and iOS require. Kept free of the
 * manifest import so the client bundle stays small.
 */
export const homeVideoStreamUrl = (video: { src: string }) => `/film/${video.src.split("/").pop()}`;

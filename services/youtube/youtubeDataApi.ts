import "dotenv/config";

import type {
  PublicYouTubeChannel,
  PublicYouTubeVideo,
  YouTubeApiErrorResponse,
  YouTubeChannelListResponse,
  YouTubeChannelResource,
  YouTubeVideoListResponse,
  YouTubeVideoResource,
} from "./types";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const MAX_IDS_PER_REQUEST = 50;
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export class YouTubeDataApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeDataApiError";
  }
}

export async function getPublicYouTubeVideo(
  videoId: string,
): Promise<PublicYouTubeVideo> {
  const [video] = await getPublicYouTubeVideos([videoId]);
  return video;
}

export async function getPublicYouTubeVideos(
  videoIds: string[],
): Promise<PublicYouTubeVideo[]> {
  const requestedIds = normalizeVideoIds(videoIds);
  const response = await requestYouTubeDataApi<YouTubeVideoListResponse>(
    "videos",
    {
      part: "snippet,statistics",
      id: requestedIds.join(","),
    },
  );

  const videoById = new Map<string, PublicYouTubeVideo>();

  for (const resource of response.items ?? []) {
    const video = normalizeVideoResource(resource);
    videoById.set(video.id, video);
  }

  const missingIds = requestedIds.filter((id) => !videoById.has(id));
  if (missingIds.length > 0) {
    throw new YouTubeDataApiError(
      `YouTube did not return the requested public video ID(s): ${missingIds.join(", ")}. The video may be invalid, private, deleted, or restricted.`,
    );
  }

  return requestedIds.map((id) => videoById.get(id)!);
}

export async function getPublicYouTubeChannel(
  channelId: string,
): Promise<PublicYouTubeChannel> {
  const [channel] = await getPublicYouTubeChannels([channelId]);
  return channel;
}

export async function getPublicYouTubeChannels(
  channelIds: string[],
): Promise<PublicYouTubeChannel[]> {
  const requestedIds = normalizeIds(channelIds, "channel");
  const response = await requestYouTubeDataApi<YouTubeChannelListResponse>(
    "channels",
    {
      part: "snippet,statistics",
      id: requestedIds.join(","),
    },
  );

  const channelById = new Map<string, PublicYouTubeChannel>();

  for (const resource of response.items ?? []) {
    const channel = normalizeChannelResource(resource);
    channelById.set(channel.id, channel);
  }

  const missingIds = requestedIds.filter((id) => !channelById.has(id));
  if (missingIds.length > 0) {
    throw new YouTubeDataApiError(
      `YouTube did not return the requested channel ID(s): ${missingIds.join(", ")}.`,
    );
  }

  return requestedIds.map((id) => channelById.get(id)!);
}

async function requestYouTubeDataApi<T extends YouTubeApiErrorResponse>(
  resource: "videos" | "channels",
  requestParameters: Record<string, string>,
): Promise<T> {
  const apiKey = requireYouTubeApiKey();
  const url = new URL(`${YOUTUBE_API_BASE_URL}/${resource}`);

  for (const [name, value] of Object.entries(requestParameters)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error: unknown) {
    throw new YouTubeDataApiError(
      sanitizeSecret(
        `Unable to reach the YouTube Data API: ${getErrorMessage(error)}`,
        apiKey,
      ),
    );
  }

  const responseText = await response.text();
  const responseBody = parseJsonResponse<T>(responseText);

  if (!response.ok) {
    const apiMessage =
      responseBody?.error?.message ??
      responseBody?.error?.errors?.[0]?.message ??
      (response.statusText || "Unknown API error");
    const reason = responseBody?.error?.errors?.[0]?.reason;
    const reasonLabel = reason ? ` Reason: ${reason}.` : "";

    throw new YouTubeDataApiError(
      sanitizeSecret(
        `YouTube Data API request failed (${response.status}). ${apiMessage}.${reasonLabel}`,
        apiKey,
      ),
    );
  }

  if (!responseBody) {
    throw new YouTubeDataApiError(
      "The YouTube Data API returned an empty or invalid JSON response.",
    );
  }

  return responseBody;
}

function requireYouTubeApiKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (!apiKey) {
    throw new YouTubeDataApiError("YOUTUBE_API_KEY is not configured.");
  }

  return apiKey;
}

function normalizeVideoIds(videoIds: string[]): string[] {
  const ids = normalizeIds(videoIds, "video");

  for (const id of ids) {
    if (!VIDEO_ID_PATTERN.test(id)) {
      throw new YouTubeDataApiError(
        `The configured YouTube PlatformPost does not contain a valid 11-character video ID: ${id}`,
      );
    }
  }

  return ids;
}

function normalizeIds(ids: string[], label: string): string[] {
  const normalizedIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  if (normalizedIds.length === 0) {
    throw new YouTubeDataApiError(
      `At least one YouTube ${label} ID is required.`,
    );
  }

  if (normalizedIds.length > MAX_IDS_PER_REQUEST) {
    throw new YouTubeDataApiError(
      `A maximum of ${MAX_IDS_PER_REQUEST} YouTube ${label} IDs can be requested at once.`,
    );
  }

  return normalizedIds;
}

function normalizeVideoResource(
  resource: YouTubeVideoResource,
): PublicYouTubeVideo {
  const id = requireString(resource.id, "video id");
  const title = requireString(resource.snippet?.title, `title for video ${id}`);
  const channelId = requireString(
    resource.snippet?.channelId,
    `channel id for video ${id}`,
  );
  const publishedAt = parseDate(
    resource.snippet?.publishedAt,
    `publishedAt for video ${id}`,
  );
  const viewCount = parseRequiredCount(
    resource.statistics?.viewCount,
    `viewCount for video ${id}`,
  );

  return {
    id,
    title,
    channelId,
    publishedAt,
    viewCount,
    likeCount: parseOptionalCount(
      resource.statistics?.likeCount,
      `likeCount for video ${id}`,
    ),
    commentCount: parseOptionalCount(
      resource.statistics?.commentCount,
      `commentCount for video ${id}`,
    ),
  };
}

function normalizeChannelResource(
  resource: YouTubeChannelResource,
): PublicYouTubeChannel {
  const id = requireString(resource.id, "channel id");
  const title = requireString(resource.snippet?.title, `title for channel ${id}`);
  const subscriberCount = resource.statistics?.hiddenSubscriberCount
    ? null
    : parseOptionalCount(
        resource.statistics?.subscriberCount,
        `subscriberCount for channel ${id}`,
      );
  const contentCountAsBigInt = parseOptionalCount(
    resource.statistics?.videoCount,
    `videoCount for channel ${id}`,
  );

  return {
    id,
    title,
    subscriberCount,
    totalViewCount: parseOptionalCount(
      resource.statistics?.viewCount,
      `viewCount for channel ${id}`,
    ),
    contentCount:
      contentCountAsBigInt === null
        ? null
        : toSafeInteger(contentCountAsBigInt, `videoCount for channel ${id}`),
  };
}

function parseRequiredCount(value: string | undefined, fieldName: string): bigint {
  const parsedValue = parseOptionalCount(value, fieldName);

  if (parsedValue === null) {
    throw new YouTubeDataApiError(`${fieldName} is missing.`);
  }

  return parsedValue;
}

function parseOptionalCount(
  value: string | undefined,
  fieldName: string,
): bigint | null {
  if (value === undefined) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    throw new YouTubeDataApiError(
      `${fieldName} must be a nonnegative integer string.`,
    );
  }

  return BigInt(value);
}

function parseDate(value: string | undefined, fieldName: string): Date {
  const rawValue = requireString(value, fieldName);
  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new YouTubeDataApiError(`${fieldName} is not a valid date.`);
  }

  return parsedDate;
}

function requireString(value: string | undefined, fieldName: string): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new YouTubeDataApiError(`${fieldName} is missing.`);
  }

  return normalizedValue;
}

function toSafeInteger(value: bigint, fieldName: string): number {
  const numberValue = Number(value);

  if (!Number.isSafeInteger(numberValue)) {
    throw new YouTubeDataApiError(
      `${fieldName} is outside JavaScript's safe integer range.`,
    );
  }

  return numberValue;
}

function parseJsonResponse<T>(responseText: string): T | null {
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return null;
  }
}

function sanitizeSecret(message: string, secret: string): string {
  return message.replaceAll(secret, "[redacted]");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown network error";
}

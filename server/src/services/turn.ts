import { env } from "../config/env";

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const isIceServer = (value: unknown): value is IceServer => {
  if (!value || typeof value !== "object") return false;
  const urls = (value as Record<string, unknown>).urls;
  return typeof urls === "string"
    || (Array.isArray(urls) && urls.length > 0 && urls.every((url) => typeof url === "string"));
};

export const generateIceServers = async (): Promise<IceServer[]> => {
  if (!env.cloudflareTurnKeyId || !env.cloudflareTurnApiToken) return env.iceServers;

  try {
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.cloudflareTurnKeyId)}/credentials/generate-ice-servers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.cloudflareTurnApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: env.turnCredentialTtlSeconds }),
      },
    );

    if (!response.ok) throw new Error(`Cloudflare TURN trả về HTTP ${response.status}`);
    const payload = await response.json() as { iceServers?: unknown };
    if (!Array.isArray(payload.iceServers) || !payload.iceServers.every(isIceServer))
      throw new Error("Cloudflare TURN trả về cấu hình ICE không hợp lệ");
    return payload.iceServers;
  } catch (error) {
    console.error("Không thể tạo Cloudflare TURN credential, chuyển sang STUN:", error);
    return env.iceServers;
  }
};

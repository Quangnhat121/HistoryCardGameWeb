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

export const getIceServers = async (): Promise<IceServer[]> => {
  if (!env.meteredTurnDomain || !env.meteredTurnApiKey) return env.iceServers;

  try {
    const domain = env.meteredTurnDomain
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/$/, "");
    if (!/^[a-z0-9.-]+\.metered\.live$/i.test(domain))
      throw new Error("METERED_TURN_DOMAIN không hợp lệ");

    const endpoint = new URL(`https://${domain}/api/v1/turn/credentials`);
    endpoint.searchParams.set("apiKey", env.meteredTurnApiKey);
    endpoint.searchParams.set("region", env.meteredTurnRegion);
    const response = await fetch(endpoint);

    if (!response.ok) throw new Error(`Metered TURN trả về HTTP ${response.status}`);
    const payload = await response.json() as unknown;
    if (!Array.isArray(payload) || !payload.every(isIceServer))
      throw new Error("Metered TURN trả về cấu hình ICE không hợp lệ");
    return payload;
  } catch (error) {
    console.error("Không thể tải Metered TURN credential, chuyển sang STUN:", error);
    return env.iceServers;
  }
};

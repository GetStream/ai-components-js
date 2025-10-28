import { Buffer } from "node:buffer";
import { Readable } from "node:stream";

export const dataUrlToReadable = (dataUrl: string): Readable => {
  const [meta, data] = dataUrl.split(",");
  if (!meta || !data) throw new Error("Invalid data URL");

  const isBase64 = meta.includes(";base64");

  const buffer = isBase64
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data), "utf8");

  return Readable.from(buffer);
};

export const GetToolOutput = (parts: any[]) => {
  const filtered = parts
    .map((part: any) =>
      part.type.startsWith("tool-") && part.state === "output-available"
        ? part.output
        : ""
    )
    .filter((item) => item !== "");

  if (filtered?.length < 1) {
    return null;
  }
  return "```ai-tool-weather\n" + JSON.stringify(filtered?.[0] || {}) + "\n```";
};

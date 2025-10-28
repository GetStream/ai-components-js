import { GetToolOutput } from "@/utils/helpers";
import { Markdown } from "../markdown";

export default function ToolsOutput({ parts = [] }: { parts: any[] }) {
  const output = GetToolOutput(parts);
  if (!output) {
    return null;
  }

  return <Markdown>{output}</Markdown>;
}

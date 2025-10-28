import { tool } from "ai";
import { z } from "zod";

export const tools = {
  weather: tool({
    description: "Get the current weather",
    inputSchema: z.object({
      location: z.string().describe("The city and state"),
    }),
    execute: async ({ location }) => {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${process.env.OPENWEATHER_API_KEY}&q=${location}&aqi=no`
      );

      return await response.json();
    },
  }),
};

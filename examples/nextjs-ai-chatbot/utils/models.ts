import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { LanguageModel } from 'ai';

export const MODELS = [
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    model: openai('gpt-4.1-nano'),
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    model: google('gemini-2.5-flash'),
  },
  // {
  //   id: "grok-4",
  //   name: "Grok-4",
  //   model: xai("grok-4"),
  // },
];

export const GetModel = (model: string): LanguageModel => {
  return MODELS.find((m) => m.id === model)?.model as LanguageModel;
};

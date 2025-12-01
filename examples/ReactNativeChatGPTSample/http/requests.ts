import { post } from './api.ts';

export const startAI = async (channelId: string) =>
  post('http://192.168.1.218:3000/start-ai-agent', { channel_id: channelId });
export const stopAI = async (channelId: string) =>
  post('http://192.168.1.218:3000/stop-ai-agent', { channel_id: channelId });

// export const startAI = async (channelId: string) =>
//   post('https://stream-nodejs-ai-e5d85ed5ce6f.herokuapp.com/start-ai-agent', {
//     channel_id: channelId,
//   });
// export const stopAI = async (channelId: string) =>
//   post('https://stream-nodejs-ai-e5d85ed5ce6f.herokuapp.com/stop-ai-agent', {
//     channel_id: channelId,
//   });

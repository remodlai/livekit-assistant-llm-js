import OpenAI from 'openai';
import { Room } from 'livekit-client';
import { AccessToken } from 'livekit-server-sdk';
import { AssistantLLM } from '../src/assistant';
import { RemoteParticipant } from '@livekit/rtc-node';

async function main() {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Create LiveKit access token
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: 'assistant',
      name: 'AI Assistant'
    }
  );

  at.addGrant({
    room: 'test-room',
    roomJoin: true,
    canPublish: true,
    canSubscribe: true
  });

  // Connect to LiveKit room
  const room = new Room();
  const token = at.toJwt();
  await room.connect(process.env.LIVEKIT_URL!, await token);

  // Initialize assistant
  const assistant = new AssistantLLM(openai, {
    assistant_id: 'asst_...' // Your assistant ID
  });

  // Subscribe to data messages
  room.on('dataReceived', async (payload: Uint8Array, participant: RemoteParticipant) => {
    if (!participant) return;
    
    try {
      const message = JSON.parse(new TextDecoder().decode(payload));
      if (message.type === 'text') {
        console.log(`Received from ${participant.identity}:`, message.content);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Keep the process running
  await new Promise(() => {});
}

main().catch(console.error); 
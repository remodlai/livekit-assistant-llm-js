import 'dotenv/config';
import OpenAI from 'openai';
import { Room, RoomEvent } from 'livekit-client';
import { AccessToken } from 'livekit-server-sdk';
import { AssistantLLM } from '../src/assistant';

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');
  if (!process.env.LIVEKIT_API_KEY) throw new Error('LIVEKIT_API_KEY is required');
  if (!process.env.LIVEKIT_API_SECRET) throw new Error('LIVEKIT_API_SECRET is required');
  if (!process.env.LIVEKIT_URL) throw new Error('LIVEKIT_URL is required');

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Create LiveKit access token
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
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
  const room = new Room({
    adaptiveStream: true,
    dynacast: true
  });

  room.on(RoomEvent.Connected, () => {
    console.log('Connected to room');
  });

  room.on(RoomEvent.ParticipantConnected, (participant) => {
    console.log('Participant connected:', participant.identity);
  });

  // Initialize assistant
  const assistant = new AssistantLLM(openai, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID || 'asst_...' // Your assistant ID
  });

  await assistant.init();
  console.log('Assistant initialized');

  // Connect to room
  const token = await at.toJwt();
  await room.connect(process.env.LIVEKIT_URL, token);
  console.log('Room connection established');

  // Handle incoming messages
  room.on('dataReceived', async (payload, participant) => {
    if (!participant) return;
    
    try {
      const message = JSON.parse(new TextDecoder().decode(payload));
      console.log(`Received message from ${participant.identity}:`, message);

      if (message.type === 'text') {
        const response = await assistant.handleInput(message.content);
        await room.localParticipant.publishData(
          Buffer.from(JSON.stringify({ type: 'text', content: response })),
          { reliable: true }
        );
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('Disconnecting...');
    await room.disconnect();
    process.exit(0);
  });

  await new Promise(() => {});
}

main().catch(console.error); 
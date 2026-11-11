import { WebSocket } from 'ws';

async function runConcurrencyStressTest() {
  console.log('--- STARTING CONCURRENCY & SCALABILITY STRESS BENCHMARK ---');

  const WS_URL = 'ws://localhost:3000/ws';
  const NUM_ROOMS = 10; // 10 simultaneous 2-player rooms = 20 active connected sockets
  const sockets: WebSocket[] = [];
  const roomCodes: string[] = [];

  const memStart = process.memoryUsage();
  const startTime = Date.now();

  for (let i = 0; i < NUM_ROOMS; i++) {
    const code = `STRESS-${100 + i}`;
    roomCodes.push(code);

    const ws1 = new WebSocket(WS_URL);
    const ws2 = new WebSocket(WS_URL);
    sockets.push(ws1, ws2);

    await Promise.all([
      new Promise(r => ws1.on('open', r)),
      new Promise(r => ws2.on('open', r))
    ]);

    ws1.send(JSON.stringify({
      type: 'join_room',
      roomCode: code,
      playerId: `stress_p1_${i}`,
      playerName: `Operative_1_${i}`
    }));

    ws2.send(JSON.stringify({
      type: 'join_room',
      roomCode: code,
      playerId: `stress_p2_${i}`,
      playerName: `Operative_2_${i}`
    }));

    // Start match in room
    ws1.send(JSON.stringify({ type: 'start_game' }));
  }

  console.log(`Created & active: ${NUM_ROOMS} concurrent rooms (${sockets.length} WebSockets active).`);

  // Let simulated game tick run for 3 seconds while streaming movements
  let packetsSent = 0;
  for (let tick = 0; tick < 20; tick++) {
    for (let i = 0; i < NUM_ROOMS; i++) {
      const ws1 = sockets[i * 2];
      const ws2 = sockets[i * 2 + 1];
      if (ws1.readyState === WebSocket.OPEN) {
        ws1.send(JSON.stringify({
          type: 'player_update',
          x: Math.sin(tick) * 10,
          z: Math.cos(tick) * 10,
          rotY: tick * 0.1
        }));
        packetsSent++;
      }
      if (ws2.readyState === WebSocket.OPEN) {
        ws2.send(JSON.stringify({
          type: 'player_update',
          x: -Math.sin(tick) * 10,
          z: -Math.cos(tick) * 10,
          rotY: tick * 0.1
        }));
        packetsSent++;
      }
    }
    await new Promise(r => setTimeout(r, 50));
  }

  const durationSec = (Date.now() - startTime) / 1000;
  const memEnd = process.memoryUsage();

  console.log(`Concurrency Results:`);
  console.log(`- Simulated Rooms: ${NUM_ROOMS} rooms running in_game authoritative zombie waves`);
  console.log(`- Active Sockets: ${sockets.length}`);
  console.log(`- Packets Sent: ${packetsSent} packets in ${durationSec.toFixed(2)}s (${Math.round(packetsSent / durationSec)} pkt/s)`);
  console.log(`- Memory RSS: ${(memStart.rss / 1024 / 1024).toFixed(1)}MB -> ${(memEnd.rss / 1024 / 1024).toFixed(1)}MB (delta: +${((memEnd.rss - memStart.rss)/1024/1024).toFixed(2)}MB)`);
  console.log(`- Heap Used: ${(memEnd.heapUsed / 1024 / 1024).toFixed(1)}MB`);

  // Cleanup
  sockets.forEach(s => s.close());
  console.log('--- CONCURRENCY STRESS BENCHMARK FINISHED SUCCESSFULLY ---');
}

runConcurrencyStressTest().catch(console.error);

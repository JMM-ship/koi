import net from 'net';

export default async function handler(req, res) {
  const host = '38.60.223.56';
  const port = 3307;

  const socket = new net.Socket();

  // 超时设置 5 秒
  socket.setTimeout(5000);

  socket.on('connect', () => {
    socket.destroy();
    res.status(200).json({ success: true, message: `✅ 成功连接 ${host}:${port}` });
  });

  socket.on('timeout', () => {
    socket.destroy();
    res.status(500).json({ success: false, message: `⏱ 超时，无法连接 ${host}:${port}` });
  });

  socket.on('error', (err) => {
    res.status(500).json({ success: false, message: `❌ 连接失败: ${err.message}` });
  });

  socket.connect(port, host);
}
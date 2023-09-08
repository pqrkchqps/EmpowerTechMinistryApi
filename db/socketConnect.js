const pgp = require("pg-promise")();
const socket = require("socket.io");
function socketConnect(server) {
  const io = socket(server);
  let aliveSockets = [];

  // broadcasting ping
  setInterval(function () {
    io.emit("ping", { timestamp: new Date().getTime() });
    console.log("sent ping");
  }, 5000); // 10 seconds

  // cleaning up stalled socket which does not answer to ping
  setInterval(function () {
    for (idx in aliveSockets) {
      if (!aliveSockets[idx]) {
        return;
      }
      if (aliveSockets[idx].lastPong + 30 < new Date().getTime() / 1000) {
        aliveSockets[idx].socket.disconnect(0);
        delete aliveSockets[idx];
        console.error("delete connection");
      }
    }
  }, 5000);

  io.on("connection", function (socket) {
    console.log("open connection");
    aliveSockets[socket.id] = { socket, lastPong: new Date().getTime() / 1000 };

    socket.on("pong", function () {
      console.log("got pong");
      aliveSockets[socket.id] = {
        socket: socket,
        lastPong: new Date().getTime() / 1000,
      };
    });
  });

  async function subscribe() {
    let params = "";
    if (process.env.NODE_ENV === "production") {
      params = "?sslmode=no-verify";
    }
    const db = pgp({ connectionString: process.env.DATABASE_URL + params });

    async function startNotificationListener() {
      const connection = await db.connect();

      // Subscribe to the 'watchers' notification channel
      await connection.query("LISTEN thread");
      await connection.query("LISTEN article");
      await connection.query("LISTEN comment");

      console.log("Notification listener started.");

      // Listen for notifications
      connection.client.on("notification", (data) => {
        console.log("Received notification:", data.channel, data.payload);
        // Handle the notification payload here
        const notificationData = JSON.parse(data.payload);
        io.emit("newNotification", {data: notificationData, type: data.channel});
      });
    }

    startNotificationListener().catch((error) => {
      console.error("Error in notification listener:", error);
    });
  }
  subscribe();
}

module.exports = socketConnect;

const pgp = require("pg-promise")();
const socket = require("socket.io");

async function socketConnect(server) {
  const io = socket(server);

  let aliveSockets = [];
  let uidToMessages = [];

  // broadcasting ping
  setInterval(function () {
    io.emit("ping", { timestamp: new Date().getTime() });
  }, 5000);

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
    let uidForSocket = null;
    aliveSockets[socket.id] = { socket, lastPong: new Date().getTime() / 1000 };

    socket.on("pong", function () {
      aliveSockets[socket.id] = {
        socket: socket,
        lastPong: new Date().getTime() / 1000,
      };
    });

    socket.on("notificationsRecieved", ({ uid, type }) => {
      console.log("notificationsRecieved", uid, type);
      socket.emit("notificationsAck", type);
      if (uidToMessages[uid]) delete uidToMessages[uid][type];
    });

    function sendMessages() {
      if (uidForSocket) {
        for (const type in uidToMessages[uidForSocket]) {
          socket.emit("newNotifications", {
            data: uidToMessages[uidForSocket][type],
            type,
          });
        }
      }
    }

    // send messages
    setInterval(() => {
      sendMessages();
    }, 2000);

    socket.on("uid", (uid) => {
      console.log(uid);
      uidForSocket = uid;
      socket.emit("uidRecieved");
      if (uidToMessages[uid] && Object.keys(uidToMessages[uid]).length > 0) {
        sendMessages();
      } else {
        uidToMessages[uid] = [];
      }
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
        notificationData.children = [];

        const type = data.channel;

        for (const uid in uidToMessages) {
          if (!uidToMessages[uid][type]) {
            uidToMessages[uid][type] = [];
          }

          // for each socket, but what if two are somehow open, consider checking in interval and deleting old connections
          uidToMessages[uid][type].push(notificationData);
        }
      });
    }
    startNotificationListener().catch((error) => {
      console.error("Error in notification listener:", error);
    });
  }
  subscribe();
}

module.exports = socketConnect;

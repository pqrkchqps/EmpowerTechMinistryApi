const pgp = require("pg-promise")();
const socket = require("socket.io");
const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.SERVICEJSON);
const firebaseConfig = {
  projectId: "empower-tech-ministry-18d81",
  messagingSenderId: "176389127114",
  appId: "1:176389127114:android:602988a8bba78503fd2d33",
  apiKey: "AIzaSyDeA8l8Xcq2L1tM3DI7X4n1YmaDbdT3pJE",
  credential: admin.credential.cert(serviceAccount),
};
admin.initializeApp(firebaseConfig);

const messaging = admin.messaging();

async function socketConnect(server) {
  const io = socket(server);

  let aliveSockets = [];
  let uidToMessages = [];
  let uidToTokens = [];

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
    aliveSockets[socket.id] = { socket, lastPong: new Date().getTime() / 1000 };
    var uidForSocket = null;

    socket.on("pong", function () {
      aliveSockets[socket.id] = {
        socket: socket,
        lastPong: new Date().getTime() / 1000,
      };
    });

    socket.on("getNotifications", (uid) => {
      sendMessages(uid);
    });

    socket.on("notificationsRecieved", ({ uid, type }) => {
      console.log("notificationsRecieved", uid, type);
      socket.emit("notificationsAck", type);
      if (uidToMessages[uid]) delete uidToMessages[uid][type];
    });

    function sendMessages(uid) {
      if (uid) {
        for (const type in uidToMessages[uid]) {
          socket.emit("newNotifications", {
            data: uidToMessages[uid][type],
            type,
          });
        }
      }
    }

    // send messages
    setInterval(() => {
      if (uidForSocket) {
        sendMessages(uidForSocket);
      }
    }, 5000);

    socket.on("uid", ({ uid, token }) => {
      console.log(uid);
      uidForSocket = uid;
      tokenForSocket = null;
      uidToTokens[uid] = token;
      console.log("uid, token", uid, uidToTokens[uid]);
      socket.emit("uidRecieved");
      if (uidToMessages[uid] && Object.keys(uidToMessages[uid]).length > 0) {
        sendMessages(uid);
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

        for (const uid in uidToTokens) {
          messaging
            .send({
              token: uidToTokens[uid],
              notification: {
                title: notificationData.title,
                body:
                  notificationData.username + " - " + notificationData.content,
              },
              data: {
                payload: JSON.stringify({ data: notificationData, type }),
              },
              android: {
                priority: "high",
                notification: {
                  icon: "notification_icon",
                  color: "#010049",
                },
              },
            })
            .then((response) => {
              console.log("Successfully sent message:", response);
            })
            .catch((error) => {
              console.log("Error sending message:", error);
            });
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

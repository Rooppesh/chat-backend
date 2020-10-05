// Importing
import express from "express";
import mongoose from "mongoose";
import Message from "./messages.js";
import Pusher from "pusher";
import Config from "./config.js";
import cors from "cors";

// App Config
const app = express();
const port = process.env.PORT || 9000;

var pusher = new Pusher(Config.PUSHER_CONNECTION);

// Middleware
app.use(express.json());
app.use(cors());

// DB Config
const connection_url = Config.MONGO_CONNECTION_STRING;
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", () => {
  console.log(`DB Connected`);
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log(`DB Updated : `, change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        roomId: messageDetails.roomId,
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error Triggering Pusher!");
    }
  });
});

// Api Routes
app.get("/", (req, res) => res.status(200).send("Server is Up & Running.. :)"));

app.post("/v1/message/create", (req, res) => {
  const messageBody = req.body;
  Message.create(messageBody, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      console.log(messageBody);

      res.status(201).send(data);
    }
  });
});

app.get("/v1/message/sync", (req, res) => {
  Message.find({})
    .where("roomId")
    .equals(req.query.roomId)
    .exec(function (err, data) {
      if (err) {
        res.status(500).send(err);
      } else {
        console.log(data);
        data.sort((b, a) => {
          return a.timestamp - b.timestamp;
        });
        res.status(200).send(data);
      }
    });
});

// Listener
app.listen(port, () => console.log(`Listening to Port:${port}`));

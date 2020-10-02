// Importing
import express from "express";
import mongoose from "mongoose";
import Message from "./messages.js";
import Pusher from "pusher";
import Constants from "./constants.js";

// App Config
const app = express();
const port = process.env.PORT || 9000;

var pusher = new Pusher({
  appId: Constants.PUSHER_APP_ID,
  key: Constants.PUSHER_KEY,
  secret: Constants.PUSHER_SECRET,
  cluster: "ap2",
  encrypted: true,
});

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// DB Config
const connection_url = Constants.MONGO_CONNECTION_STRING;
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
      res.status(500).send(err);
    } else {
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
        res.status(200).send(data);
      }
    });
});

// Listener
app.listen(port, () => console.log(`Listening to Port:${port}`));

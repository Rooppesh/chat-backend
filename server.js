// Importing
import express from "express";
import mongoose from "mongoose";
import Message from "./messages.js";

// App Config
const app = express();
const port = process.env.PORT || 9000;

// Middleware
app.use(express.json());

// DB Config
const connection_url =
  "mongodb+srv://admin:UAtyR8tX5CDUGlDE@cluster0.youzg.mongodb.net/chatdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ????

// Api Routes
app.get("/", (req, res) => res.status(200).send("Hello World"));

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

// Listener
app.listen(port, () => console.log(`Listening to Port:${port}`));

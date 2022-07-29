// age: parseInt(age),
//external imports
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectID;
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const port = process.env.PORT || 4000;

const app = express();
require('dotenv').config();

//database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nlclv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000,
  keepAlive: true,
});

//middlewars
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hello World!'));

client.connect((err) => {
  const reminderCollection = client
    .db('tweetsy')
    .collection('reminderCollection');

  app.get('/api/all-list', (req, res) => {
    reminderCollection
      .find({})
      .toArray()
      .then((response) => {
        res.status(200).send(response);
      })
      .catch((err) => res.send({ msg: 'Failed' }));
  });

  app.get('/api/reminder-list', (req, res) => {
    const { ownerEmail } = req.body;

    reminderCollection
      .find({
        ownerEmail: ownerEmail,
      })
      .toArray()
      .then((response) => {
        res.status(200).send({ response, msg: 'success' });
      })
      .catch((err) => res.send({ msg: 'Failed' }));
  });

  app.post('/api/add-reminder', (req, res) => {
    // const order = req.body;
    const { reminderText, reminderTime, ownerEmail } = req.body;
    // console.log(reminderText, reminderTime, ownerEmail);
    if (reminderText && reminderTime && ownerEmail) {
      reminderCollection
        .insertOne({
          reminderText,
          reminderTime,
          ownerEmail,
        })
        .then((result) => {
          res.status(200).send({ result, msg: 'success' });
        })
        .catch((err) => {
          console.log(err);
          res.send({ msg: 'Failed' });
        });
    } else {
      res.send({ msg: 'Please Send all data properly' });
    }
  });

  // It will execute at every minute
  cron.schedule('* * * * *', async () => {
    try {
      const thisTime = new Date();
      console.log(thisTime);
      reminderCollection
        .find({
          reminderTime: thisTime,
        })
        .toArray()
        .then(async (response) => {
          console.log(response);
          response.map(async (resp) => {
            // sending reminder our user by email
            var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS,
              },
            });

            var mailOptions = {
              from: process.env.EMAIL,
              to: sendTo,
              subject: 'Remind from Tweetsy ',
              text: `Text: ${resp.text}`,
            };

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                res.send('err' + error);
              } else {
                res.send(info);
              }
            });

            // end mail
          });
        })
        .catch((err) => res.send({ msg: 'Failed' }));
    } catch (err) {
      res.send(err);
    }
  });

  console.log({ msg: 'database connected successfully' });
  // client.close();
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
// app.listen(port, () =>
//   console.log(`Example app listening at http://localhost:${port}`)
// );

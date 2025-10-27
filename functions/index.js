const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const driverRoutes = require('./routes/driver') 

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

mongoose.connect(uri);
const connection = mongoose.connection;

connection.once("open", () => {
  console.info("MongoDB database connection established successfully");
});

app.use("/user", driverRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT,  "0.0.0.0",  () => {
  console.log(`Server is running on ${PORT}`);
});

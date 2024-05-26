const express = require('express')
const app = express()
const mongoose = require("mongoose");
const cors = require('cors')
const createError = require('http-errors');
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
} catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
}
};

connectDB()
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", (req,res)=>{
    console.log('Server ON');
    res.send('Server On')
});
  
app.use(async (req, res, next) => {
    next(createError.NotFound('This route does not exist!!'));
})

app.listen(process.env.PORT, () => {
    console.log(`Server app listening on port ${process.env.PORT}`);
});
  
const express = require('express')
const app = express()
const mongoose = require("mongoose");
const cors = require('cors')
const userRoute = require('./routes/userRoue')
const adminRoute = require('./routes/adminRoute')
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

app.use(cors({
    origin: ["http://localhost:5173"],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }));
  
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", userRoute);
app.use("/api/admin", adminRoute);

  
app.use(async (req, res, next) => {
    next(createError.NotFound('This route does not exist!!'));
})

app.listen(process.env.PORT, () => {
    console.log(`Server app listening on port ${process.env.PORT}`);
});
  




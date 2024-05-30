const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName : {
      type : String,
      required : true
  },
  lastName : {
    type : String,
    required  : true
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  mobile: {
    type: Number,
    required: true,
  },
  join_date : {
    type: Date,
    required : true
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  is_admin: {
    type: Boolean,
    default: false,
  },
  is_purchased : {
    type : Boolean,
    default : false
  },
  is_completed : {
    type:Boolean,
    default : false
  },
  completed_chapters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chapter",
    },
  ],
  is_loggedin : {
    type : Boolean,
    default : false
  }
});

const userModel = new mongoose.model("user", userSchema);
module.exports = userModel;
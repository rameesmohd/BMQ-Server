const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  refered_user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  partner_id : {
    type : String,
    required : true
  },
  password : {
    type : String,
    required : true
  }
});

const userModel = new mongoose.model("partner", userSchema);
module.exports = userModel;
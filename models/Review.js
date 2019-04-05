let mongoose = require("mongoose");
let reviewSchema = new mongoose.Schema({
    Text:String,
    User:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username: String,
    },
    Restaurant:{
        id:{
             type:mongoose.Schema.Types.ObjectId,
            ref:"Restaurant"
        }
    },
    Rating:Number,
    ReviewDate:String
});
module.exports = mongoose.model("Review",reviewSchema);
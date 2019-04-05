let mongoose = require("mongoose");
let RestaurantSchema = new mongoose.Schema({
    Name: {type:String, unique:true, required:true},
   Image: String,
   ImageToken:String,
   Address:String,
   Postcode:String,
   Type: String,
  Telephone: String,
   Description:String,
   lat:Number,
   lng:Number,
   Originator:{
       id: {
           type:mongoose.Schema.Types.ObjectId,
           ref:"User"
       },
       username:String,
       Email:String,
   },
   Reviews:[{
       type: mongoose.Schema.Types.ObjectId,
         ref: "Review"
   }]
});
module.exports =  mongoose.model("Restaurant",RestaurantSchema);
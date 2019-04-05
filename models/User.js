let mongoose = require("mongoose");
let PLM = require("passport-local-mongoose");
let bcrypt = require("bcrypt-nodejs");

let userSchema = new mongoose.Schema({
    username: {type:String, unique:true, required:true},
    Email: {type:String, unique:true, required:true},
    Avatar:String,
    AvatarToken:String,
    Type:String,
    password: String,
    resetToken:String,
    resetExpires:Date,
    //FACEBOOK
    facebookID:String,
    facebookEmail:String,
    facebookName:String,
    //TWITTER
    twitterID:String,
    twitterName:String,
    twitterEmail:String,
    //GOOGLE
    googleID:String,
    googleName:String,
    googleEmail:String
});
userSchema.plugin(PLM);
let User = mongoose.model("User", userSchema);
module.exports = mongoose.model("User", userSchema);
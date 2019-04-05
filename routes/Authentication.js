let express = require("express");
let router = express.Router();
let User = require("../models/User");
let passport = require("passport");
let custompassport = require("../config/custompassport");
let nodemailer = require("nodemailer");
let async = require("async");
let crypto = require("crypto");
let transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"donotreplycritic@gmail.com",
        pass:"72UJ9G68NbrrLDcyhPtgjP7rqBjurnSHK8dAL2QvXU"
    }
});
let multer = require("multer");
let storage = multer.diskStorage({
    filename: function(req,file,callback){
        callback(null,Date.now() + file.originalname);
    }
});
let imageFilter = function(req,file,cb){
        //Accept only image files
        if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
            return cb(new Error("Only image files are allowed!!"),false);
        }
        cb(null,true);
    };
let upload = multer({storage:storage, fileFilter:imageFilter});
let cloudinary = require("cloudinary");
cloudinary.config({
    cloud_name: "critichub",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
//const Google = require("googleapis");
let Auth = require("../auth");
const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
];
router.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

//Opens homepage
router.get("/",function(req,res){
//     let Admin = new User({
//     username:"Admin",
//     Type:"HubAdmin",
//     Email:"asomanikofi@yahoo.com"
// });
//  let mailOptions = {
//         from : "donotreplycritic@gmail.com",
//         to:Admin.Email,
//         subject:"Welcome to Critichub " + Admin.username,
//         text: "Admin User for MongoDB Atlas"
//     };
//     User.register(Admin,"&Xyak2t&zHd-cR$uZF?qa7TE",function(err,user){
//         if(err){
//             console.log(err.message);
//         }
//         passport.authenticate(Admin)(req,res,function(){
//         });
//         transporter.sendMail(mailOptions,function(error,info){
//         if(error){
//             console.log(error);
//         }else{
//             console.log(info.response + " Success");
//         }
//         });
//     });
    res.render("home");
    
});

//Authentication Routes
router.get("/register",function(req, res) {
    res.render("User/newUser");
});

//==========================================================RESET ROUTES==============================================================================================
router.get("/reset",function(req,res){
    res.render("User/reset");
});
router.post("/reset",function(req, res,next) {
    async.waterfall([
        function(done){
            crypto.randomBytes(20,function(err, buf){
                let token = buf.toString("hex");
                done(err,token);
            });
        },
        function(token,done){
            User.findOne({Email:req.body.Email},function(err,user){
                if(!user || err){
                    req.flash("Error","No account was found with that email address");
                    return res.redirect("/reset");
                }
               user.resetToken = token;
               user.resetExpires = Date.now() + 3600000;
                user.save(function(err){
                    done(err,token,user);
                });
            });
        },
        function(token, user,done){
        let mailOptions = {
        from : "donotreplycritic@gmail.com",
        to:user.Email,
        subject:"Password Reset",
        text: "You (We hope) have requested a password reset.\n\n" + 
        "Click on the following link, or paste it into your browser to reset your password:\n\n" +
        "http://"+ req.headers.host + "/reset/" + token + "\n\n" +
        "If you didnt request it please delete this email"
    };
     transporter.sendMail(mailOptions,function(error,info){
        if(error){
            req.flash("Error", error.message);
        }else{
            console.log(info.response + " Success");
            req.flash("Success","An email was sent to " +user.Email + "with further instructions");
            done(error,"done");
        }
    });
        }
        ],function(err){
            if(err) return next(err);
                res.redirect("/reset");
        }
        );
});
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetToken: req.params.token, resetExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user || err) {
      req.flash('Error', 'Password reset token is invalid or has expired.');
      return res.redirect('/reset');
    }
    res.render('User/resetpassword', {token: req.params.token});
  });
});
router.post('/reset/:token',function(req, res) {
    async.waterfall([
        function(done){
            User.findOne({ resetToken: req.params.token, resetExpires: { $gt: Date.now() } },function(err,user){
                if(!user){
                    req.flash('Error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
                }
                if(req.body.firstpassword === req.body.confirmpassword){
                    user.setPassword(req.body.confirmpassword, function(err){
                        user.resetToken = undefined;
                        user.resetExpires = undefined;
                        
                        user.save(function(err){
                            req.logIn(user,function(err){
                                done(err,user);
                            });
                        });
                    });
                }else{
                    req.flash("Error","Passwords do not match");
                    return res.redirect("back");
                }
                
            });
        },
        function(user,done){
            let mailOptions = {
        from : "donotreplycritic@gmail.com",
        to:user.Email,
        subject:"Successful Password Reset",
        text: "Your password reset was successful"
    };
         transporter.sendMail(mailOptions,function(error,info){
        if(error){
            console.log(error);
            req.flash("Error", error.message);
        }else{
            console.log(info.response + " Success");
            req.flash("Success","Password has been reset");
            done(error);
        }
    });
        }
        
        ],function(err){
            res.redirect("/restaurants");
        }
        );
});
//========================================END OF RESET LINKS==========================================================================================================


//========================================FACEBOOK LINKS================================================================================================================
router.get("/auth/facebook",passport.authenticate("facebook",{scope:["email"]}));
router.get("/auth/facebook/callback",passport.authenticate("facebook",{successRedirect:"/facebookcomplete",failureRedirect:"/restaurants"}));
router.get("/facebookcomplete",function(req,res){
   if(typeof(req.user.Type) == "undefined"){
        res.render("User/facebookcomplete");
   }else{
       res.redirect("/restaurants");
   }
});
router.post("/facebookcomplete",upload.single("Link"),function(req, res) {
    let Type =  req.body.UserType;
    let Email = req.body.Email;
     User.findById(req.body.UserID,function(err, user) {
         if(err || !user){
             req.flash("Error","Line 211");
             console.log(err);
         }else{
         cloudinary.v2.uploader.upload(req.file.path,function(err,result){
        if(err){
             req.flash("Error",err.message);
            return res.redirect("back");
        }
        user.Avatar = result.secure_url;
        user.AvatarToken = result.public_id;
        user.Type = Type;
        user.Email = Email;
    User.findByIdAndUpdate(user._id, user,{new:true},function(err,user){
        if(err){
            req.flash("Error","Line 225");
            console.log(err);
             return res.redirect("back");
        }else{
            req.flash("Success","Profile Complete");
            res.redirect("/restaurants");
        }
    });
    });
         }
     });
});
//========================================TWITTER LINKS================================================================================================================
router.get("/auth/twitter",passport.authenticate(("twitter")));
router.get("/auth/twitter/callback",passport.authenticate("twitter",{successRedirect:"/completeprofile",failureRedirect:"/restaurants"}));
router.get("/completeprofile",function(req,res){
   if(typeof(req.user.Type) == "undefined"){
       res.render("User/completeprofile");
   }else{
       res.redirect("/restaurants");
   }
});
router.post("/confirmprofile",function(req,res){
    let Type = req.body.UserType;
    User.findById(req.body.UserID,function(err, user) {
        if(err ||  !user){
            req.flash("Error","Line 251");
            console.log(err);
            return res.redirect("back");
        }else{
            user.Type = Type;
            User.findByIdAndUpdate(user._id, user,{new: true},function(err,user){
                if(err){
            req.flash("Error",err.message);
            return res.redirect("back");
                }else{
                     req.flash("Success","Profile Complete");
                     res.redirect("/restaurants");
                }
            });
        }
    });
});
//==============================================================================GOOGLE LINKS===========================================================================
router.get("/auth/google",passport.authenticate("google",{scope:scopes}));
router.get("/auth/google/callback",passport.authenticate("google",{successRedirect:"/completeprofile",failureRedirect:"/restaurants"}));


router.post("/register",upload.single("Link"),function(req, res) {
    let HubUser = new User({username:req.body.username,Type:req.body.UserType,Email:req.body.Email,Avatar:"",AvatarToken:""});
    let Owner = "Welcome to CriticHub as an Owner you can: \n 1. Add your restaurant \n 2. Cannot leave reviews on any restaurant \n 3. Edit Restaurant \n 4. Delete Restaurant \n 5. View Profile \n 6. Edit Email, Name & Image \n 7. Remove Account";
    let Critic = "Welcome to Critichub \n As a Critic you can: \n  1. Leave multiple reviews on restaurants \n 2. Cannot add a restaurant \n 4. Edit Review \n 5. Delete Review \n 6. View Profile \n 7. Edit Email, Name & Image \n 8. Remove Account";
        let mailOptions = {
        from : "donotreplycritic@gmail.com",
        to:HubUser.Email,
        subject:"Welcome to CriticHub " + HubUser.username,
        text: ""
    };
    cloudinary.v2.uploader.upload(req.file.path,function(err,result){
        if(err){
             req.flash("Error","Line 285");
             console.log(err);
            return res.redirect("back");
        }
        HubUser.Avatar = result.secure_url;
        HubUser.AvatarToken = result.public_id;
        User.register(HubUser, req.body.password,function(err,user){
        if(err){
            req.flash("Error","Line 293");
            console.log(err);
            return res.render("User/newUser", {error: err.message});
        }
        passport.authenticate("local")(req,res,function(){
            if(HubUser.Type == "Owner"){
                mailOptions.text = Owner;
            }else if (HubUser.Type == "Critic"){
                mailOptions.text = Critic;
            }
    transporter.sendMail(mailOptions,function(error,info){
        if(error){
            console.log(error);
        }else{
            console.log(info.response + " Success");
        }
    });
    req.flash("Success","Welcome to the Hub " + user.username);
            res.redirect("/restaurants");
        });
    });
    });
});
router.get("/login",function(req,res){
    res.render("User/login");
});
router.post("/login",
passport.authenticate("local",{successRedirect:"/restaurants",failureRedirect:"/login", failureFlash: true}),
function(req, res) {
    
});
router.get("/logout",function(req, res) {
     req.logout();
     req.flash("Success","Logged Out");
     res.redirect("/restaurants");
 });

module.exports = router;
//Routes for Critichub Admin Panel
let express = require("express");
let router = express.Router();
let User = require("../models/User");
let Restaurant = require("../models/restaurants");
let Review = require("../models/Review");
let passport = require("passport");
let nodemailer = require("nodemailer");
let transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"donotreplycritic@gmail.com",
        pass:"72UJ9G68NbrrLDcyhPtgjP7rqBjurnSHK8dAL2QvXU"
    }
});
let NodeGeocoder = require("node-geocoder");
let options = {
    provider:"google",
    httpAdapter: "https",
    apiKey: process.env.GEOCODER_API_KEY,
    formatter:null
};
let geocoder = NodeGeocoder(options);
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
router.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

//Sends Admin to login (Only one Admin)
router.get("/admin",function(req,res){
    res.render("Admin/adminlogin");
});

//Both post routes redirect you to users table (Quick way to fix the submission issue)
router.post("/admin",
passport.authenticate("local",{successRedirect:"/admin/users",failureRedirect:"/admin", failureFlash: true}),
function(req, res) {
    
});
router.post("/admin/login",
passport.authenticate("local",{successRedirect:"/admin/users",failureRedirect:"/admin", failureFlash: true}),
function(req, res) {
    
});

//Admin views All The Hub users
router.get("/admin/users",Check,function(req,res){
    User.find({},function(err,users){
        if(err || !users){
req.flash("Error","Line 70");
console.log(err);
return res.redirect("back");
        }else{
            res.render("Admin/users",{Users:users});
        }
    });
});

//Admin views all the restaurants on the Hub
router.get("/admin/restaurants",Check,function(req, res) {
    Restaurant.find({},function(err,restaurants){
        if(err){
           req.flash("Error",err.message);
           return res.redirect();
        }else{
            res.render("Admin/restaurants",{Restaurants:restaurants});
        }
    });
});

//Admin Edits restaurant
router.get("/admin/restaurants/:id/edit",Check,function(req, res) {
    Restaurant.findById(req.params.id,function(err,currentRestaurant){
        if(err){
            req.flash("Error","Restaurant has not been found");
            return res.redirect("back");
        } else{
res.render("Admin/EditRestaurant",{restaurant:currentRestaurant}); 
}
    });

});

//Admin updates restaurant
router.put("/admin/restaurants/:id",Check,upload.single("Link"),function(req,res){
 if(req.file){
    Restaurant.findById(req.params.id,function(err,restaurant){
    if(err){
                req.flash("Error","Line 109");
                console.log(err);
                res.redirect("back");
            }
            cloudinary.v2.uploader.destroy(restaurant.ImageToken,function(err,result){
    if(err){
                    req.flash("Error","Line 115");
                    console.log(err);
                    return res.redirect("back");
            }
                cloudinary.v2.uploader.upload(req.file.path,function(err,result){
    if(err){
                        req.flash("Error","Line 121");
                        console.log(err);
                        return res.redirect("back");
            }
                    //Check for new Address
                        let OriginalAddress = req.body.Address;
                        let newAddress = "";
        if(req.body.newAddress){
        if(req.body.newAddress != ""){
             newAddress = req.body.newAddress; 
         }
         }
         if(newAddress != ""){
 if(OriginalAddress != newAddress){
        geocoder.geocode(newAddress,function(err,data){
    if(err || !data){
            req.flash("Error","Line 229");
            console.log(err);
            return res.redirect("back");
        }
    let lat = data[0].latitude;
    let lng = data[0].longitude;
    let Address = data[0].formattedAddress;
    let Tester = {
        Name: req.body.Name,
        Image:result.secure_url,
        ImageToken: result.public_id,
        Address: Address,
        Postcode:req.body.Postcode,
        Type:req.body.Type,
        Telephone: req.body.Telephone,
        Description:req.body.Description,
        lat:lat,
        lng:lng
    };
    Restaurant.findByIdAndUpdate(req.params.id, Tester,{new: true},function(err, update){
    if(err || !update){
            req.flash("Error","Line 250");
            console.log(err);
            return res.redirect("back");
        }else{
let mailOptions = {
        from : "donotreplycritic@gmail.com",
        to:update.Originator.Email,
        subject:"Admin changes",
        text: "The Admin has made some changes to your restaurant login and take a look \n Any issues email the Admin at admincritichub@gmail.com"
    };
transporter.sendMail(mailOptions,function(error,info){
        if(error){
            req.flash("Error",err.message);
            res.redirect("back");
        }else{
            console.log(info.response + " Success");
        }
    });
res.redirect("/admin/restaurants");
                   }
});
});
 }else{
     //     //geocoder.geocode(Address,function(err,data){// if(err || !data.length){//         req.flash("Error","Invalid Address");//         return res.redirect("back");//     }// let lat = data[0].latitude;// let lng = data[0].longitude;// Address = data[0].formattedAddress;
        let Tester = {
        Name: req.body.Name,
        Image:result.secure_url,
        ImageToken: result.public_id,
        Address: req.body.Address,
   Postcode:req.body.Postcode,
   Type:req.body.Type,
   Telephone: req.body.Telephone,
   Description:req.body.Description
    };
    Restaurant.findByIdAndUpdate(req.params.id, Tester,{new: true},function(err, update){
    if(err || !update){
            req.flash("Error","Line 273");
            console.log(err);
            return res.redirect("back");
        }else{
           let mailOptions = {
        from : "donotreplycritic@gmail.com",
        to:update.Originator.Email,
        subject:"Admin changes",
        text: "The Admin has made some changes to your restaurant login and take a look \n Any issues email the Admin at admincritichub@gmail.com"
    };
transporter.sendMail(mailOptions,function(error,info){
        if(error){
            req.flash("Error",err.message);
            res.redirect("back");
        }else{
            console.log(info.response + " Success");
        }
    });
res.redirect("/admin/restaurants");
        }
});
//});
 }
 }
});
});
});
        }else{
         let OriginalAddress = req.body.Address;
         let newAddress = "";
        if(req.body.newAddress){
        if(req.body.newAddress != ""){
             newAddress = req.body.newAddress; 
         }
         }
             
         if(newAddress != ""){
         if(OriginalAddress != newAddress){
           geocoder.geocode(newAddress,function(err,data){
        if(err || !data){
            req.flash("Error","Invalid Address");
            console.log("Line 303: " + err);
            return res.redirect("back");
        }
    let lat = data[0].latitude;
    let lng = data[0].longitude;
    let Address = data[0].formattedAddress;
    let Tester = {
        Name: req.body.Name,
        Address: Address,
        Postcode:req.body.Postcode,
        Type:req.body.Type,
        Telephone: req.body.Telephone,
        Description:req.body.Description,
        lat:lat,
        lng:lng
        };
    Restaurant.findByIdAndUpdate(req.params.id, Tester,{new: true},function(err, update){
    if(err || !update){
            req.flash("Error",err.message);
            res.redirect("back");
        }else{
           let mailOptions = {
        from : "donotreplycritic@gmail.com",
        to:update.Originator.Email,
        subject:"Admin changes",
        text: "The Admin has made some changes to your restaurant login and take a look \n Any issues email the Admin at admincritichub@gmail.com"
    };
transporter.sendMail(mailOptions,function(error,info){
        if(error){
            req.flash("Error",err.message);
            res.redirect("back");
        }else{
            console.log(info.response + " Success");
        }
    });
res.redirect("/admin/restaurants");
        }
});
}); 
}else{
    let Tester = {
        Name: req.body.Name,
        Address: req.body.Address,
        Postcode:req.body.Postcode,
        Type:req.body.Type,
        Telephone: req.body.Telephone,
        Description:req.body.Description
    };
    Restaurant.findByIdAndUpdate(req.params.id, Tester,{new: true},function(err, update){
    if(err || !update){
            req.flash("Error","Line 347");
            console.log(err);
            return res.redirect("back");
        }else{
           let mailOptions = {
        from : "donotreplycritic@gmail.com",
        to:update.Originator.Email,
        subject:"Admin changes",
        text: "The Admin has made some changes to your restaurant login and take a look \n Any issues email the Admin at admincritichub@gmail.com"
    };
transporter.sendMail(mailOptions,function(error,info){
        if(error){
            req.flash("Error",err.message);
            res.redirect("back");
        }else{
            console.log(info.response + " Success");
        }
    });
res.redirect("/admin/restaurants");
        }
});
}
}
    }
});

//Admin removes restaurant, Owner is notified before restaurant is removed.
router.delete("/admin/restaurants/:id",Check,function(req,res){
      Review.remove({"Restaurant.id":req.params.id},function(err){
      if(err){
          console.log("Line 319: " + err);
          res.redirect("back");
      }
  });
    Restaurant.findById(req.params.id,function(err,found){
        if(err || !found){
            req.flash("Error","Line 305");
            console.log(err);
            res.redirect("back");
        }else{
            let mailOptions = {
        from : "donotreplycritic@gmail.com",
        to:found.Originator.Email,
        subject:"Your Restaurant has been removed",
        text: "Admin has removed your restaurant from the Hub \n Please to contact critichubadmin@gmail.com if there is an issue with this"
    };
    transporter.sendMail(mailOptions,function(error,info){
        if(error){
             req.flash("Error","Line 317");
             console.log(error);
            return res.redirect("back");
        }else{

        }
    });
        }
    try{
          cloudinary.v2.uploader.destroy(found.ImageToken);
          Restaurant.findByIdAndRemove(req.params.id,function(err){
        if(err){
           req.flash("Error","Line 329");
           console.log(err);
           return res.redirect("back");
        }else{
            req.flash("Success","Restaurant has been removed");
            res.redirect("/admin/restaurants");
        }
    });
      }catch(err){
          req.flash("Error",err.message);
          return res.redirect("back");
      }
    });
});

router.get("/admin/logout",function(req, res) {
     req.logout();
     req.flash("Success","You have left the admin panel");
     res.redirect("/restaurants");
 });

function Check(req,res,next){
    if(req.isAuthenticated()){
        if(req.user.Type != "HubAdmin"){
             req.flash("Error","This page is off limits");
             res.redirect("/restaurants");
        }else{
            next();
        }
    }else{
        res.redirect("/");
    }
}
module.exports = router;
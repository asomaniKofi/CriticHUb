let express = require("express");
let router = express.Router();
let Restaurant = require("../models/restaurants");
let Review = require("../models/Review");
let nodemailer = require("nodemailer");
let NodeGeocoder = require("node-geocoder");
let transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"donotreplycritic@gmail.com",
        pass:"72UJ9G68NbrrLDcyhPtgjP7rqBjurnSHK8dAL2QvXU"
    }
});
let options = {
    provider:"google",
    httpAdapter: "https",
    apiKey: process.env.GEOCODER_API_KEY,
    formatter:null
};
let geocoder = NodeGeocoder(options);
let Fuse = require("fuse.js");
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

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//Loads all restaurants
router.get("/restaurants",Mental,function(req,res){
     if(req.isAuthenticated()){
       if(req.user.Type == "HubAdmin"){
           res.redirect("/admin/users");
       }else{}
    if(req.query.Search){
        const regex = new RegExp(escapeRegex(req.query.Search),"gi");
         Restaurant.find({"Name":regex},function(err,allrestaurants){
     if(err){
         req.flash("Error","Line 62");
         console.log(err);
     }else{
         if(allrestaurants.length < 1){
             req.flash("Error","Sorry no Matches found");
         }
         res.render("Restaurants/IndexOfRestaurants",{Restaurants:allrestaurants});
     }
 });
    }else{
         Restaurant.find({},function(err,allrestaurants){
     if(err){
         console.log(err.message);
     }else{
         //console.log(allrestaurants);
         res.render("Restaurants/IndexOfRestaurants",{Restaurants:allrestaurants});
     }
 });
    }
     }else{
          if(req.query.Search){
        const regex = new RegExp(escapeRegex(req.query.Search),"gi");
        
         Restaurant.find({"Name":regex},function(err,allrestaurants){
     if(err){
         console.log(err);
     }else{
         if(allrestaurants.length < 1){
             req.flash("Error","Sorry no Matches found");
         }
         res.render("Restaurants/IndexOfRestaurants",{Restaurants:allrestaurants});
     }
 });
    }else{
         Restaurant.find({},function(err,allrestaurants){
     if(err){
         console.log(err.message);
     }else{
         res.render("Restaurants/IndexOfRestaurants",{Restaurants:allrestaurants});
     }
 });
    }
     }
 });
//Add new restaurant 
router.get("/restaurants/new",userStatus,function(req,res){
    res.render("Restaurants/newRestaurant");
});

//Create new restaurant
router.post("/restaurants",userStatus,upload.single("Link"),function(req,res){
let NameData =  req.body.Name;
let ImageLink =  req.body.Link;
let ImageID;
let Address = req.body.LineOne + "," + req.body.LineTwo + "," + req.body.LineThree;
let postcode = req.body.Postcode;
let type = req.body.Type;
let phone = req.body.Telephone;
let Description = req.body.Description; 
let Originator = {
    id: req.user._id,
    username: req.user.username,
    Email: req.user.Email
};
   let mailOptions = {
        from : "donotreplycritic@gmail.com",
        to:req.user.Email,
        subject:"Your Restaurant has been added",
        text: NameData + " is now apart of the Hub and can be reviewed by Critics across the world"
    };
    cloudinary.v2.uploader.upload(req.file.path,function(err,result){
        if(err){
            req.flash("Error",err.message);
            return res.redirect("back");
        }
         ImageLink = result.secure_url;
          ImageID = result.public_id;
    geocoder.geocode(Address,function(err,data){
    if(err || !data){
        req.flash("Error","Invalid Address");
       console.log("Line 142: " + err);
        return res.redirect("back");
    }
    let lat = data[0].latitude;
    let lng = data[0].longitude;
    Address = data[0].formattedAddress;
    Restaurant.create({
    Name:NameData,
    Image:ImageLink,
    ImageToken:ImageID,
    Address: Address,
    Postcode:postcode,
    Type:type,
    Telephone: phone,
    Description:Description,
    lat:lat,
    lng:lng,
    Originator : Originator
  },function(err,result){
    if(err){
        req.flash("Error","Line 162");
        console.log(err);
        return res.redirect("back");
    }else{
transporter.sendMail(mailOptions,function(error,info){
        if(error){
            console.log(error);
        }else{
            console.log(info.response + " Success");
        }
    });
    res.redirect("/restaurants/"+result.id);
    }});
});
 });
});

//Opens Selected restaurant
router.get("/restaurants/:id",function(req,res){
Restaurant.findById(req.params.id).populate("Reviews").exec(function(err,result){
if(err || !result){
    req.flash("Error","Restaurant not found");
     res.redirect("/restaurants");
} else{
     res.render("Restaurants/restaurant",{restaurant:result})}});
});
//Edit Restaurant
router.get("/restaurants/:id/edit",checkOwnership,function(req, res) {
    Restaurant.findById(req.params.id,function(err,currentRestaurant){
        if(err || !currentRestaurant){
            req.flash("Error","Restaurant has not been found");
            res.redirect("back");
        } else{
res.render("Restaurants/EditRestaurant",{restaurant:currentRestaurant}); 
}
    });

});

//Update Restaurant
router.put("/restaurants/:id",userStatus,upload.single("Link"),function(req,res){
    if(req.file){
    Restaurant.findById(req.params.id,function(err,restaurant){
    if(err){
                req.flash("Error","Line 206");
                console.log(err);
                res.redirect("back");
            }
            cloudinary.v2.uploader.destroy(restaurant.ImageToken,function(err,result){
    if(err){
                    req.flash("Error","Line 213");
                    console.log(err);
                    return res.redirect("back");
            }
                cloudinary.v2.uploader.upload(req.file.path,function(err,result){
    if(err){
                        req.flash("Error","Line 218");
                        console.log(err);
                        return res.redirect("back");
            }
                    //Check for new Address
                        let OriginalAddress = req.body.Address;
                        let newAddress = "";
         if(req.body.LineOne != ""){
             if(req.body.LineTwo != ""){
                 if(req.body.LineThree != ""){
                     newAddress = req.body.LineOne + " " + req.body.LineTwo + " " + req.body.LineThree;
                 }
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
            req.flash("Success","Update Successful");
            res.redirect("/restaurants/"+update._id);
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
            req.flash("Success","Update Successful");
            res.redirect("/restaurants/"+update._id);
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
         if(req.body.LineOne != ""){
             if(req.body.LineTwo != ""){
                 if(req.body.LineThree != ""){
                     newAddress = req.body.LineOne + " " + req.body.LineTwo + " " + req.body.LineThree ;
                 }
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
            res.redirect("/restaurants/"+update._id);
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
            req.flash("Success","Update Successful");
            res.redirect("/restaurants/"+update._id);
        }
});
}
}
    }
});

//Delete Restaurant
router.delete("/restaurants/:id",userStatus,function(req,res){
  Review.remove({"Restaurant.id":req.params.id},function(err){
      if(err){
          console.log("Line 365: " + err);
          res.redirect("back");
      }
  });
  Restaurant.findById(req.params.id,function(err,restaurant){
      if(err || !restaurant){
          req.flash("Error","Line 364");
          console.log(err);
          return res.redirect("back");
      }
      try{
          cloudinary.v2.uploader.destroy(restaurant.ImageToken);
          Restaurant.findByIdAndRemove(req.params.id,function(err){
        if(err){
            console.log("Line 372: "+err);
        }else{
            req.flash("Success","Restaurant has been removed");
            res.redirect("/restaurants");
        }
    });
      }catch(err){
          req.flash("Error","Line 379");
          console.log(err);
          return res.redirect("back");
      }
  });
});

//Middleware
function userStatus(req, res, next){
 if(req.isAuthenticated()){
if(req.user.Type == "Owner"){
    return next();
}else{
        req.flash("Error","Wrong Path Mate");
     res.redirect("back");
}
    return next();
 }else{
    req.flash("Error","Please Login First");
     res.redirect("/login");
 }
 }
function checkOwnership(req,res,next){
     if(req.isAuthenticated()){
         Restaurant.findById(req.params.id,function(err,found){
             if(err || !found){
             req.flash("Error","Restaurant not found");
             res.redirect("/restaurants");
         }else{
             if(found.Originator.id.equals(req.user._id)){
                next();
             }else{
                res.redirect("/restaurants");
             }}});}else{
     req.flash("Error","Please Login First");
      res.redirect("/login");   }}
function Mental(req,res,next){
   if(req.isAuthenticated()){
       if(req.user.Type == "HubAdmin"){
         return  res.redirect("/admin/users");
       }else{
           return next();
       }
   }else{
       return next();
   }
}
      
module.exports = router;
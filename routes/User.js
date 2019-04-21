let express = require("express");
let router = express.Router({mergeParams:true});
let nodemailer = require("nodemailer");
require('locus');
let transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"donotreplycritic@gmail.com",
        pass:"2b7aa296rfqghzp83py9dd4sg39dfk7rha2wje2un26d2k96q4"
    }
});
let User = require("../models/User");
let Restaurant = require("../models/restaurants");
let Review = require("../models/Review");
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

//Load user Profile
router.get("/user/:id",Check,function(req,res){
    User.findById(req.user._id,function(err,finaluser){
        if(err || !finaluser){
             req.flash("Error",err);
             console.log("Line 44: " + err);
            return res.redirect("back");
        }
        
            if(finaluser.Type == "Critic"){
               Review.find({"User.username":finaluser.username},function(err,userreview){
                   if(err){
                        req.flash("Error",err);
                        console.log("Line 51: "+ err);
                        console.log("Line 53");
               return res.render("User/profile",{User:finaluser});
                   }else{
                 console.log("Line 56");
                  return res.render("User/profile",{Critic:userreview});
                   }
               });
            } 
            
            if(finaluser.Type == "Owner"){
                Restaurant.find({"Originator.username":finaluser.username},function(err,userrestaurant){
            if(err){
                  console.log("Line 65");
                 return res.render("User/profile",{User:finaluser});
                    }else{
                        if(!userrestaurant){
                        console.log("Line 69");
                        return res.render("User/profile",{User:finaluser});
                        }
                        console.log("Line 72");
                    return res.render("User/profile",{Owner:userrestaurant});
                    }
                });
            }
      //return res.render("User/profile",{User:finaluser});
    });
});
router.get("/user/:id/edit",function(req,res){
User.findById(req.params.id,function(err,founduser){
        if(err){
            req.flash("Error","User not found");
            console.log("Line 75: "+ err);
            res.redirect("back");
        } else{
res.render("User/editprofile",{User:founduser});
}
});
});
router.put("/user/:id",SecurityCheck,upload.single("Link"),function(req,res){
    let UserType = req.user.Type;
    let newEmail = req.body.Email;
    let newName = req.body.Name;
    let link;
    let token;
if(UserType == "Owner"){
         if(req.file){
         User.findById(req.user._id,function(err,user){
             if(err){
                req.flash("Error","Line 92");
                console.log(err);
                res.redirect("back");
             }
              cloudinary.v2.uploader.destroy(user.AvatarToken,function(err,result){
                 if(err){
                      req.flash("Error","Line 98");
                      console.log(err);
                    return res.redirect("back");
                 } 
                 console.log(result);
              });
              cloudinary.v2.uploader.upload(req.file.path,function(err,result){
                  if(err){
                        req.flash("Error","Line 106");
                        console.log(err);
                        return res.redirect("back");
                }else{
                    link = result.secure_url;
                    token = result.public_id;
                    if(!newEmail || newEmail == null){
                    return res.redirect("back");
                    }
                    if(!newName || newName == null){
                    return res.redirect("back");
                    }
                    let updatedUser = {
                    username : newName,
                    Email: newEmail,
                    Avatar: link,
                    AvatarToken: token
                    };
        Restaurant.find({"Originator.username":req.user.username},function(err,restaurant){
            if(err){
                console.log(err);
           req.flash("Error","Something went wrong Line 150");
           console.log(err);
           res.redirect("back");
            }else{
                
                if(restaurant.Originator){
            //if(restaurant.Originator.username != newName){
                restaurant.Originator.username = newName;
                //if(restaurant.Originator.Email != newEmail){
                    restaurant.Originator.Email = newEmail;
                //}
                restaurant.save(function(err){
                    if(err){
                        console.log(err);
          req.flash("Error","Something went wrong Line 156");
           return res.redirect("back");
                    }
                });
            //}
            }
            if(restaurant.Originator){
            if(restaurant.Originator.Email != newEmail){
                restaurant.Originator.Email = newEmail;
                if(restaurant.Originator.username != newName){
                    restaurant.Originator.username = newName;
                }
                restaurant.save(function(err){
                    if(err){
                        console.log("Issue 168");
                        console.log(err);
                    }
                });
            }
            }
            User.findByIdAndUpdate(req.user._id, updatedUser,{new:true},function(err,update){
            if(err){
            req.flash("Error","Line 186");
            console.log(err);
           return res.redirect("back");
            }else{
             req.login(update,function(err){
                    if(err){
                        console.log("Line 133: " + err);
                       res.redirect("/restaurants");  
                    }
                });
                 res.redirect("/restaurants");
            }
        });
            }
        });
    User.findByIdAndUpdate(req.user._id, updatedUser,{new:true},function(err,update){
            if(err){
            req.flash("Error","Line 126");
            console.log(err);
            res.redirect("back");
            }else{
                req.login(update,function(err){
                    if(err){
                        console.log("Line 133: " + err);
                       res.redirect("/restaurants");  
                    }
                });
                 res.redirect("/restaurants");
            }
     });
     }
     });
     });
     }
     if(!newEmail || newEmail == null){
            return res.redirect("back");
        }
        if(!newName || newName == null){
             return res.redirect("back");
        }
        let updatedUser = {
            username : newName,
            Email: newEmail
        };
        Restaurant.find({"Originator.username":req.user.username},function(err,restaurant){
            if(err){
                console.log(err);
           req.flash("Error","Something went wrong Line 150");
           console.log(err);
           res.redirect("back");
            }else{
                
                if(restaurant.Originator){
            if(restaurant.Originator.username != newName){
                restaurant.Originator.username = newName;
                if(restaurant.Originator.Email != newEmail){
                    restaurant.Originator.Email = newEmail;
                }
                restaurant.save(function(err){
                    if(err){
                        console.log(err);
          req.flash("Error","Something went wrong Line 156");
           return res.redirect("back");
                    }
                });
            }
            }
            if(restaurant.Originator){
            if(restaurant.Originator.Email != newEmail){
                restaurant.Originator.Email = newEmail;
                if(restaurant.Originator.username != newName){
                    restaurant.Originator.username = newName;
                }
                restaurant.save(function(err){
                    if(err){
                        console.log("Issue 168");
                        console.log(err);
                    }
                });
            }
            }
            User.findByIdAndUpdate(req.user._id, updatedUser,{new:true},function(err,update){
            if(err){
            req.flash("Error","Line 186");
            console.log(err);
           return res.redirect("back");
            }else{
             req.login(update,function(err){
                    if(err){
                        console.log("Line 133: " + err);
                       res.redirect("/restaurants");  
                    }
                });
                 res.redirect("/restaurants");
            }
        });
            }
        });
     } //Owner Logic
if(UserType == "Critic"){
if(req.file){
        User.findById(req.user._id,function(err,user){
                if(err){
                req.flash("Error","Line 201");
                console.log(err);
                res.redirect("back");
                }
                cloudinary.v2.uploader.destroy(user.AvatarToken,function(err,result){
                    if(err){
                    req.flash("Error","Line 207");
                    console.log(err);
                    res.redirect("back");
                }else{
                    console.log(result);
                }
                });
                 cloudinary.v2.uploader.upload(req.file.path,function(err,result){
                     if(err){
                        req.flash("Error","Line 211");
                        console.log(err);
                        return res.redirect("back");
                    }else{
                            link = result.secure_url;
                            token = result.public_id;
                            if(!newEmail || newEmail == null){
                            return res.redirect("back");
                            }
                            if(!newName || newName == null){
                            return res.redirect("back");
                            }
        Review.find({"User.id":req.params.id},function(err,review){
                    if(err){
                            console.log("Line 267 issue");
                            console.log(err);
                            }else{
for(let q =0; q<review.length; q++){
        if(review[q].User){
        review[q].User.username = newName
        Restaurant.findById(review[q].Restaurant.id,function(err,restaurant){
        //eval(require("locus")); 
        if(err){
                console.log(err);
                req.flash("Error",err);
                res.redirect("back");
                }else{
                if(restaurant.Reviews){
                if(restaurant.Reviews.length > 0){
                for(let x=0; x < restaurant.Reviews.length; x++){
                }
                console.log(restaurant.Reviews);
                }
                }
                }
                });
                review[q].User.username = newName;
                review[q].save(function(err){
                if(err){
                console.log("Line 274");
                throw err;
                }
                });
                
                }
}
                }
        });
                    }
                    let updatedUser = {
                            username : newName,
                            Email: newEmail,
                            Avatar: link,
                            AvatarToken: token
                            };
            User.findByIdAndUpdate(req.user._id, updatedUser,{new:true},function(err,update){
            if(err){
            req.flash("Error","Line 269");
            console.log(err);
            return res.redirect("back");
            }else{
            req.login(update,function(err){
                    if(err){
                        console.log("Line 133: " + err);
                       res.redirect("/restaurants");  
                    }
                });
                 res.redirect("/restaurants");
            }
        });
        });
        });
         }else{
        if (!newEmail || newEmail == null){
            return res.redirect("back");
        }
        if(!newName || newName == null){
             return res.redirect("back");
        }
        Review.find({"User.id":req.params.id},function(err,review){
                    if(err){
                            console.log("Line 267 issue");
                            console.log(err);
                            }else{
for(let y =0; y<review.length; y++){
        if(review[y].User){
        review[y].User.username = newName
        Restaurant.findById(review[y].Restaurant.id,function(err,restaurant){
        //eval(require("locus")); 
        if(err){
                console.log(err);
                req.flash("Error",err);
                res.redirect("back");
                }else{
                if(restaurant.Reviews){
                if(restaurant.Reviews.length > 0){
                for(let x=0; x < restaurant.Reviews.length; x++){
                }
                console.log(restaurant.Reviews);
                }
                }
                }
                });
                review[y].User.username = newName;
                review[y].save(function(err){
                if(err){
                console.log("Line 274");
                throw err;
                }
                });
                
                }
}
                }
        });
        let updatedUser = {
            username : newName,
            Email: newEmail
                          };
        User.findByIdAndUpdate(req.user._id, updatedUser,{new:true},function(err,update){
            if(err){
            req.flash("Error","Line 286");
            console.log(err);
            res.redirect("back");
            }else{
             req.login(update,function(err){
                    if(err){
                        console.log("Line 133: " + err);
                       res.redirect("/restaurants");  
                    }
                });
            res.redirect("/restaurants");
            }
});
         }

     }
});
router.delete("/user/:id",SecurityCheck,function(req,res){
    let Email = req.user.Email;
    let UserType = req.user.Type;
    let name = req.user.username
    let mailOptions = {
        from : "donotreplycritic@gmail.com",
        to:Email,
        subject:"Account Removed :(",
        text:"You removed your account \n Sad to see you go but the door is always open for a return \n Can`t wait to see you again"
        };
   if(UserType == "Owner"){
       Restaurant.find({"Originator.username":name},function(err,restaurant){
           if(err){
          req.flash("Error",err.message);
          return res.redirect("back");
           }
           if(restaurant.ImageToken){
               try{
                cloudinary.v2.uploader.destroy(restaurant.ImageToken);
           }catch(err){
               console.log(err);
           }
           }
        Restaurant.remove({"Originator.username":name},function(err){
          if(err){
          req.flash("Error",err.message);
          return res.redirect("back");
          }
                  console.log("Success");
               });
               User.findByIdAndRemove(req.user.id,function(err){
                   if(err){
                       console.log(err);
                   }else{
        transporter.sendMail(mailOptions,function(error,info){
        if(error){
            console.log(error);
        }else{
            console.log(info.response + " Success");
            console.log(info);
        }
    });
                    req.flash("Success","Your account has been removed :(");
                    res.redirect("/restaurants");
                   }

               });
       });
   }
    if(UserType == "Critic"){
       Review.remove({"User.username":name},function(err){
           if(err){
                req.flash("Error",err.message);
               return res.redirect("back");
           }else{
        transporter.sendMail(mailOptions,function(error,info){
        if(error){
            console.log(error);
        }else{
            console.log(info.response + " Success");
            User.findByIdAndRemove(req.user.id,function(err){
                   if(err){
                       console.log(err);
                   }else{
        transporter.sendMail(mailOptions,function(error,info){
        if(error){
            console.log(error);
        }else{
            console.log(info.response + " Success");
            req.flash("Success","Your account has been removed :( ");
            res.redirect("/restaurants");
        }
    });
        }
    });
           }
       });
   }
});
}
});

function Check(req,res,next){
    if(req.isAuthenticated()){
User.findById(req.params.id,function(err, founduser) {
        if(err){
            req.flash("Error","Something went wrong");
            res.redirect("/restaurants");
        }else{
    if(founduser._id.equals(req.params.id)){
       return next();
            }else{
            req.flash("Error","Something went wrong");
            res.redirect("/restaurants");
            }
        }
    });
    }else{
         req.flash("Error","End Up Here");
         res.redirect("/restaurants");
    }
}
function SecurityCheck(req,res,next){
    if(req.isAuthenticated()){
    User.findById(req.params.id,function(err, founduser) {
        if(err){
            req.flash("Error","Something went wrong");
            res.redirect("/restaurants");
        }else{
            if(founduser._id.equals(req.params.id)){
                     return  next();
            }else{
                req.flash("Error","Wrong route mate");
            res.redirect("/restaurants");
            }
        }
    });
    }else{
        req.flash("Error","End Up Here");
         res.redirect("/restaurants");
    }
}
module.exports = router;
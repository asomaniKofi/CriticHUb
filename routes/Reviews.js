let express = require("express");
let router = express.Router({mergeParams:true});
let Restaurant = require("../models/restaurants");
let Review = require("../models/Review");
let test = new Date();
router.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});
router.get("/restaurants/:id/reviews/new",userStatus,function(req,res){
    Restaurant.findById(req.params.id, function(err,result){
        if(err || !result){
            req.flash("Error","Restaurant not found");
            res.redirect("back");
        }else{
            res.render("reviews/reviewrestaurant",{restaurant:result}); 
        }
    });
});

router.post("/restaurants/:id/reviews",function(req,res){
     let string = req.body.custId;
     let name = req.body.Review;
  Restaurant.findById(req.params.id,function(err,result){
     if(err || !result){
         req.flash("Error",err);
         console.log(err);
         res.redirect("/restaurants");
     } else{
        Review.create({
               Text:name,
               User:req.body.user,
               Rating:string,
               ReviewDate:test.toLocaleString(),
               Restaurant: result
            },function(err,review){
             if(err){
                  req.flash("Error",err.message);
                res.redirect("back");
             }else{
              review.User.id = req.user._id;
              review.User.username = req.user.username;
              review.Restaurant.id = result._id;
              review.save();
              result.Reviews.push(review);
              result.save();
              req.flash("Success","Review has been posted");
              res.redirect("/restaurants/"+result._id);
        }});
     }
  });
});

router.get("/restaurants/:id/reviews/:reviews_id/edit",checkOwnership,function(req,res){
    Restaurant.findById(req.params.id,function(err,result){
        if(err || !result){
            req.flash("Error","Cannot find restaurant");
            console.log("Line 56: "+ err);
            res.redirect("back");
        }else{
    Review.findById(req.params.reviews_id,function(err, result) {
        if(err || !result){
            req.flash("Error","Review not found");
            console.log("Line 62: " + err);
            res.redirect("back");
        }else{
                res.render("reviews/editreview",{restaurant_id : req.params.id, review :result});
        }
    });
        }
    });
});

//Edit reviews
router.put("/restaurants/:id/reviews/:reviews_id",userStatus,function(req,res){
    let testreview = {
        Text: req.body.Review,
        Rating: req.body.custId
    }
    Review.findByIdAndUpdate(req.params.reviews_id,testreview,function(err,update){
        if(err || !update){
         req.flash("Error","Line 80");
         console.log(err);
        res.redirect("back");
        }else{
        res.redirect("/restaurants/"+req.params.id);
        }
    })
});

//Delete Review
router.delete("/restaurants/:id/reviews/:reviews_id",userStatus,function(req,res){
    Review.findByIdAndRemove(req.params.reviews_id,function(err){
        if(err){
            req.flash("Error","Line 93");
            console.log(err);
            res.redirect("back");
        }else{
            req.flash("Success","Review has been removed");
            res.redirect("/restaurants/"+req.params.id);
        }
    });
});

//Middleware
function userStatus(req, res, next){
 if(req.isAuthenticated()){
if(req.user.Type == "Critic"){
    return next();
}else{
     req.flash("Error","Wrong path mate");
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
         Review.findById(req.params.reviews_id,function(err,found){
             if(err || !found){
             req.flash("Error","Restaurant not found");
             res.redirect("back");
         }else{
             if(found.User.id.equals(req.user._id)){
                next();
             }else{
                 req.flash("","");
                res.redirect("back");
             }
         }
         });
     }else{
    req.flash("Error","Please Login First");
      res.redirect("/login");   
     }
    console.log(req.params);
 }
module.exports = router;
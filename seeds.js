let mongoose = require("mongoose");
let Restaurant =require("./models/restaurants");
 let Review = require("./models/Review");
 let User = require("./models/User");
let nodemailer = require("nodemailer");
let transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"donotreplycritic@gmail.com",
        pass:"faggart26"
    }
});
let passport = require("passport");
let testdata = [{
    Name:"Chak 89",
   Image:"http://www.wimbledonguardian.co.uk/resources/images/3393897/",
   AddressOne:"105 Bond Road",
   AddressTwo:"Mitcham",
   AddressThree:"London",
   Postcode:"CR4 3HG",
Type:"High-End Cuisine",
   Telephone: "02086462177",
   Description:"Pan-Indian, Pakistani and Sri Lankan dishes served in a huge space, with an additional banquet hall."
},
{
    Name:"Royal Garden Restaurant & Karaoke Bar",
   Image:"https://media-cdn.tripadvisor.com/media/photo-s/05/ac/fb/f1/nice-location-off-the.jpg",
   AddressOne:"Shirley Hills Road",
   AddressTwo:"Croydon",
   AddressThree:"London",
   Postcode:"CR0 5HQ",
   Type:"Karaoke Bar",
   Telephone: "02086540170",
   Description:"Simple dining room with traditional motifs, a dim sum menu and Cantonese/Szechuan dishes."
}
]
function Seed(){
    Restaurant.remove({},function(err){
    if(err){
        console.log(err);
    }else{
// testdata.forEach(function(seed){
//     Restaurant.create(seed,function(err,data){
//         if(err){
//             console.log(err)
//         }else{
//             console.log("Success");
//             Review.create({
//                 Text:"Not Bad",
//                 User:"Vishnu",
//                 Rating:"3"
//             },function(err,result){
//              if(err){
//                 console.log(err);
//              }else{
//               console.log("comment added");
//           data.Reviews.push(result);
//             data.save();
//         }});
//         }
//     });
// });
    }
});
User.remove({},function(err){
    if(err){
        console.log(err);
    }
});
Review.remove({},function(err){
  if(err){
        console.log(err);
    }  
});

}
module.exports = Seed;
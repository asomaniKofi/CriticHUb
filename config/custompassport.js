let User = require("../models/User");
let Auth = require("../auth");
let FacebookStrategy = require('passport-facebook').Strategy;
let TwitterStrategy = require("passport-twitter").Strategy;
let GoogleStrategy = require("passport-google-oauth20").Strategy;

module.exports = function(passport){
    //Facebook
    passport.use(new FacebookStrategy({
        clientID : Auth.facebookAuth.clientID,
        clientSecret:Auth.facebookAuth.clientSecret,
        callbackURL:Auth.facebookAuth.callbackURL
    },
    function(accessToken,refreshToken,profile,done){
        process.nextTick(function(){
            User.findOne({"facebookID": profile.id},function(err,user){
                if(err)
                    return done(err);
                if(user)
                    return done(null,user);
                else{
                    let FBUser = new User();
                    console.log(profile);
                    console.log("refreshToken: " + refreshToken);
                    console.log("accessToken: " + accessToken);
                    FBUser.facebookID = profile.id;
                    FBUser.facebookToken = accessToken;
                    FBUser.facebookName = profile.displayName;
                    FBUser.Email = "testing@gmail.com";
                    FBUser.username = profile.displayName;
                    console.log(FBUser);
                    FBUser.save(function(err){
                        if(err) 
                        throw err;
                        return done(null,FBUser);
                    });
                }
            });
        });
    }
    ));
    
    //Twitter
    passport.use(new TwitterStrategy({
    consumerKey: Auth.twitterAuth.consumerKey,
    consumerSecret: Auth.twitterAuth.consumerSecret,
    callbackURL:Auth.twitterAuth.callbackURL,
    passReqToCallback: true,
    userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true",
    },
    function(req,token, tokenSecret,profile,done){
        process.nextTick(function(){
            User.findOne({"twitterID": profile.id},function(err,user){
                if(err)
                return done(err);
                if(user){
                    return done(null,user);
                }else{
                    console.log(profile);
                    let twitterUser = new User();
                    twitterUser.twitterID = profile.id;
                    twitterUser.username = profile.displayName;
                    twitterUser.Email = profile.emails[0].value;
                    twitterUser.Avatar = profile.photos[0].value;
                    
                    twitterUser.save(function(err){
                        if(err)
                        throw err;
                        return done(null,twitterUser);
                    });
                }
            });
        });
    }
    ));
    
    //Google
    passport.use(new GoogleStrategy({
      clientID: Auth.GoogleAuth.OAUTH2_CLIENT_ID,
     clientSecret: Auth.GoogleAuth.OAUTH2_CLIENT_SECRET,
    callbackURL: Auth.GoogleAuth.OAUTH2_CALLBACK
  },
  function(token, tokenSecret, profile, done) {
      console.log(profile);
 User.findOne({"googleID":profile.id},function(err,user){
     if(err)
     return done(err);
     if(user){
         return done(null,user);
     }else{
         let googleUser = new User();
         googleUser.googleID = profile.id;
         googleUser.googleName= profile.displayName;
         googleUser.googleEmail = profile.emails[0].value;
         googleUser.Avatar = profile.photos[0].value;
         googleUser.Email = profile.emails[0].value;
         googleUser.username = profile.displayName;
         googleUser.save(function(err){
             if(err)
             throw err;
             return done(null,googleUser);
         });
     }
 });
  }
));
};
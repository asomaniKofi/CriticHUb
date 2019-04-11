module.exports = {
    "facebookAuth":{
       "clientID":"317102792277456",
       "clientSecret":"59f1c921a501f4b7ef4a0b045e9817d2",
       "callbackURL": "https://critichub.herokuapp.com/auth/facebook/callback"
     
    },
    "twitterAuth":{
        "consumerKey":"d91jmBLEUHWbuVrFRRILXG2Dc",
       "consumerSecret":"Qlhb0jugpEQzw7gXJgy9e7IXQbUGjPB3NbAGfezJLahM7iS3ki",
       "callbackURL": "https://critichub.herokuapp.com/auth/twitter/callback",
         includeEmail:true,
         passReqToCallback : true,
         userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true"
    },
    "GoogleAuth":{
"OAUTH2_CLIENT_ID": "708414663176-gfjdrihhtusb32ocqfpo37sned6vae8b.apps.googleusercontent.com",
"OAUTH2_CLIENT_SECRET": "tFBLgpKxHlY5dSKELbjGPbhX",
"OAUTH2_CALLBACK": "https://critichub.herokuapp.com/auth/google/callback"
    }
};
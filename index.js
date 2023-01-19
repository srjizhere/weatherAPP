const express = require('express');
const https = require('https');
const Redis = require('ioredis');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var cors = require('cors')
const cookieParser  = require('cookie-parser');

require('dotenv').config()

const {connection} = require('./config/db');
 const  {UserModel} = require("./model/User.model")
 const {authenticate} = require('./middelware/authenticate');
const { json } = require('express');
 
 
 const app = express();
 app.use(cors())

 
 app.use(express.json())
 app.use(cookieParser())
 app.get("/",(req,res)=>{
    res.send("API Base URL")
 });


 app.post("/signup",(req,res)=>{
   console.log(req.body);
   const  {name,email,password,age,city}  = req.body;
   bcrypt.hash(password,6, async function(err,hash) {
      if(err){
         console.log(err);
         res.send({"msg":"something went wrong"})
      }else{
         const user  = new UserModel({name,email,password:hash,age,city})
         await user.save();
         res.status(201).send({"msg":"signup very sucessfully"})
      }
   })
 });


 app.post("/login",async(req,res)=>{
   const  {email,password}  = req.body;
   const user = await UserModel.findOne({email});
   const hashed_password = user?.password
   if(user){
      bcrypt.compare(password,hashed_password,function(err,result){
         if(result){
            const token =  jwt.sign(
               {email, id : user._id},
                process.env.tpsc
               )
               console.log(req.cookies);
               res.clearCookie("dummy")
              res.cookie("token", "token");
            res.status(200).send({"msg":"login successfull","token":token});
         }
         else{
            res.status(401).send({"mgs":"invalid credentials"});
         }
      });
      
   }else{
      res.status(401).send({"mgs":"invalid credentials"})

   }

 });

app.post("/data",authenticate,async(req,res)=>{
  let city  = req.body.city
       const redis = new Redis({
        port : 13887,
        host :"redis-13887.c241.us-east-1-4.ec2.cloud.redislabs.com",
        username : "default",
        password: process.env.redispass,
        db : 0
    });
    let data = await redis.get(city);
    console.log(data);
       if(!data){
         console.log("doing in api");
         const https = require('node:https');
         const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.apikey}`;
         https.get(url, (resp) => {
            console.log(resp.statusCode);
            resp.on("data",(data)=>{
                data = JSON.parse(data)
                  data = data.main
               redis.set(city,JSON.stringify(data))
               data = JSON.stringify(data)
               res.send({"msg":data})
            })
         });   
    }else{
   console.log("direct doing redis");
      res.send({"msg":data})
    }
});





async function blk_logout(demo){
    const redis = new Redis({
        port : 13887,
        host :"redis-13887.c241.us-east-1-4.ec2.cloud.redislabs.com",
        username : "default",
        password: process.env.redispass,
        db : 0
    });
    let ans = await redis.rpush("blk",demo)
    let an = await redis.lrange("blk",[0,-1])
    console.log(an);
    console.log(ans)
}



app.get("/logout",(req,res)=>{
   const token = req.headers?.authorization?.split(" ")[1];
   blk_logout(token)

   
   return res.send("User logged out sucessfully")
})







































 app.listen(8080,async()=>{
   try{
      await connection
      console.log("connected sucessfully ");
      
   }catch(err){
      console.log("err connecting to db");
      console.log(err);
   }
    console.log("port is running 8080")
 })







































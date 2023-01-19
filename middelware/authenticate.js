const jwt = require('jsonwebtoken');
require('dotenv').config();

const Redis = require('ioredis');
const { json } = require('express');




async function getblklist(){

   const redis = new Redis({
      port : 13887,
      host :"redis-13887.c241.us-east-1-4.ec2.cloud.redislabs.com",
      username : "default",
      password: process.env.redispass,
      db : 0
  });
  let an = await redis.lrange("blk",[0,-1])
  console.log(an);
 return an;
}










const authenticate = async(req,res,next)=>{
    let token = req?.headers?.authorization?.split(" ")[1] || req?.cookies?.token
    console.log(token);
   if(token){
      token = JSON.parse(token)
     let blacklistfiledata =  await getblklist() 
  
      if(blacklistfiledata.includes(token)){
         return res.send("please login again")
      }
       jwt.verify(token,process.env.tpsc,function(err,decoded){
         if(err){
            console.log(err);
            if(err.message==="jwt expired"){
         return res.status(401).send({"msg":"please login","err":err.message});  
            }
            return res.send({"msg":err})
         }else{
            next()
         }
       })

   }else{
      res.status(401).send({"msg":"please login 1"})
   }
}


module.exports = {authenticate}
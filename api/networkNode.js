let express = require("express");
let app = express();
let uuid = require("uuid/v1");
let {BlockChain} = require("../Blockchain/BlockChain");

let tincture=new BlockChain()
app.get("/",(req,res)=>{
  res.status(200).json({message:"start interface"});
})

//
app.get("/blockchain",(req,res)=>{
  res.status(200).json({data:tincture.chain})
})

let port = process.env.PORT|3000
app.listen(port,()=>{
  console.log(`listening on ${port}`);
})

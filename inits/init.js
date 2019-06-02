let {BlockChain} = require("../Blockchain/BlockChain");
let {state} = require("../State/State");

let tincture=new BlockChain()
let tinctureState=new state()

module.exports={tincture,tinctureState}
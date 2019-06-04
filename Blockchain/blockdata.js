const level = require("level");
const chainData = __dirname+"/blockdata"
let db=level(chainData)
// Add data to levelDB with key/value pair
function addChainData(key,value){
    db.put(key, value, function(err) {
      if (err) return console.log('Block ' + key + ' submission failed', err);
    })
}

// Get data from levelDB with key
function getChainData(key){
    db.get(key, function(err, value) {
      if (err) return console.log('Not found!', err);
      console.log('Value = ' + value);
    })
}

function addDataToChain(value) {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            return console.log('Unable to read data stream!', err)
        }).on('close', function() {
          console.log('Block #' + i);
          addChainData(i, value);
        });
}
function getBlocksCount(){
    let len=0;
    db.createReadStream()
.on('data', function (data) {
      ++len;
 })
.on('error', function (err) {
    console.log(err)
    return 0 
 })
 .on('close', function () {
    return len    
});
}

function reloadChainData(){
    return new Promise((resolve,reject)=>{
        let i=0;
    let chainLoaded=[]
    db.createReadStream().on('data',function(data){
        console.log(data.value)
        chainLoaded.push(JSON.parse(data.value))
    })
    .on('error',function(err){
        reject(err)
    })
    .on('close',function(){
        resolve(chainLoaded)
    })
    })    
}

function checkExistence(){
    return new Promise((resolve,reject)=>{
        db.get(0, function(err, value) {
            if(err){
                reject(false)
            }else{
                resolve(true)
            }
          })
    })
}

module.exports={addChainData,getChainData,addDataToChain,reloadChainData,getBlocksCount,checkExistence}
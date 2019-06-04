const level = require("level")
const db = level(__dirname+"/blockstate");

const addStatePersistance = (value)=>{
    db.put('songs', value, function(err) {
          if (err) return console.log('Block ' + key + ' submission failed', err);
        })
}

const reloadData = ()=>{
    return new Promise((resolve,reject)=>{
        db.get('songs',function(err,value){
            if(err){
                reject(err)
            }else{
                resolve(JSON.parse(value))
            }
        })
    })
}

const stateExistence=()=>{
    return new Promise((resolve,reject)=>{
        db.get('songs',function(err,value){
            if(err){
                reject(false)
            }else{
                resolve(true)
            }
        })
    })
    
}

module.exports = {
    addStatePersistance,
    reloadData,
    stateExistence
}
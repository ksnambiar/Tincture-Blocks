const {tinctureState,tincture} = require("../inits/init");
/*
1. adding song
2. 
*/
const manager = (message)=>{
    let payload=message.payload
    
    switch(message.type){
        case 'addSong':
            tinctureState.addSong(payload)
            return "done"
        case 'addTrending':
            tinctureState.addToTrending(payload)
            return "done"
        case 'addMt':
            tinctureState.addToMt(payload)
            return "done"
        case 'getSongs':
            return tinctureState.getSongs()
        default:
            return 0
    }
}

module.exports={manager}
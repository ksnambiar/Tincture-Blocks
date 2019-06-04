const {tinctureState,tincture} = require("../inits/init");
/*
1. adding song
2. 
*/
const manager = (message)=>{
    let payload=message.payload
    let transaction=tincture.createNewDataTranasction(payload.userName,payload)
    transaction.type=message.type
    tincture.addTransactionToPendingTransactions(transaction)
    switch(message.type){
        case 'addSong':
            tinctureState.addSong(payload)
            return transaction
        case 'getSongs':
            return tinctureState.getSongs()
        default:
            return 0
    }
}

module.exports={manager}
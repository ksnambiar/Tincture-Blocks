let express = require("express");
let app = express();
let uuid = require("uuid/v1");
const rp = require('request-promise');
const {tincture,tinctureState} = require("../inits/init");
const {manager} = require("./stateHandler");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
// const {checkExistence,addChainData,reloadChainData,addPersistanceInBetween} = require("../Blockchain/blockdata");
// const {addStatePersistance,reloadData,stateExistence} = require("../Blockchain/blockstate");
let nodeAddress=uuid().split('-').join('');
const port1 = process.env.PORT||3001;
// const port1 = process.argv[2]
// node address persistance
// fs.readFile(__dirname+"/node_address.json",(err,data)=>{
// 	if(err){
// 		nodeAddress = uuid().split('-').join('')
// 		console.log("no file found so creating it....")
// 		fs.writeFileSync(__dirname+"/node_address.json",JSON.stringify({pubadd:nodeAddress}))
// 		console.log(`pid -- ${nodeAddress}`);
// 	}else{
// 		let parserData = JSON.parse(data);
// 		console.log("file already exists taking pid")
// 		nodeAddress=parserData.pubadd
// 		console.log(`pid is --- ${nodeAddress}`);
// 	}
// })

//blockchain data persistance
// checkExistence().then(obj=>{
// 	console.log("chain existing")
// 	reloadChainData().then(obj=>{
// 		console.log("chain reloaded");
// 		console.log(obj)
// 		tincture.chain=obj
// 	}).catch(err=>{
// 		console.log("2+",err)
// 	})
// }).catch(err=>{
// 	console.log("chain not existing")
// 	addChainData(0,JSON.stringify(tincture.chain[0]))
// })

//blockchain state persistance
// stateExistence().then(obj=>{
// 	reloadData().then(obj=>{
// 		tinctureState.reloadState(obj)
// 	}).catch(err=>{
// 		console.log(err)
// 	})
// }).catch(err=>{
// 	console.log(err)
// 	addStatePersistance(JSON.stringify(tinctureState.data.songs));
// })

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/",(req,res)=>{
  res.status(200).json({message:"start interface"});
})
app.get("/state/songs",(req,res)=>{
	res.status(200).json({data:tinctureState.data.songs});
})
app.get("/state/songs/:tid",(req,res)=>{
	let result
	tinctureState.forEach(obj=>{
		if(obj.tid===req.params.tid){
			result=obj
		}
	})
	res.status(200).json({data:result})
})

app.post("/state/addSong",(req,res)=>{
	let data=req.body;
	tinctureData.data.songs.push(data)
	res.status(200).json({message:"added successfully"})
})
 
app.post("/state",(req,res)=>{
	let result=manager(req.body)
	let payload=req.body.payload
	let transaction=tincture.createNewDataTranasction(payload.userName,payload)
    transaction.type=req.body.type
	tincture.addTransactionToPendingTransactions(transaction)
	const requestPromises = [];
	tincture.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/dataTransaction',
			method: 'POST',
			body: transaction,
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(obj=>{
		const requestOptions = {
			uri: tincture.currentNodeUrl + '/syncState',
			method: 'GET'
		};
		rp(requestOptions).then(obj1=>{
			if(result===0){
				res.status(400).json({message:"some error"});
			}else{
				res.status(200).json({data:result,note:"transaction broadcasted and casted"})
			}
		})
		.catch(err=>{
			res.status(400).json({err:err})
		})
	})
	.catch(obj=>{
		res.status(400).json({error:obj})
	})
	
})

//////
// endpoints start from here
/////
app.post("/testchain",(req,res)=>{
	console.log(req.body);
	res.status(200).json({message:"data recieved"})
})

app.get("/blockchain",(req,res)=>{
  res.status(200).json({data:tincture.chain})
})

//for value transactions
app.post('/valueTransaction', function(req, res) {
	const newTransaction = req.body;
	const blockIndex = tincture.addTransactionToPendingTransactions(newTransaction);
	res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

//for data storage
app.post('/dataTransaction',function(req,res){
  const newTransaction = req.body;
  const blockIndex = tincture.addTransactionToPendingTransactions(newTransaction);
  res.json({ note: `Transaction will be added in block ${blockIndex}.` });
})

//value transaction broadcast
app.post('/valueTransaction/broadcast', function(req, res) {
	const newTransaction = tincture.createNewValueTransaction(req.body.amount, req.body.sender, req.body.recipient);
	tincture.addTransactionToPendingTransactions(newTransaction);
	const requestPromises = [];
	tincture.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/valueTransaction',
			method: 'POST',
			body: newTransaction,
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		res.json({ note: 'Transaction created and broadcast successfully.' });
	});
});


//data storge transaction broadcast-[]
app.post('/dataTransaction/broadcast', function(req, res) {
	const newTransaction = tincture.createNewDataTransaction(req.body.amount, req.body.sender, req.body.recipient);
	tincture.addTransactionToPendingTransactions(newTransaction);
	const requestPromises = [];
	tincture.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/dataTransaction',
			method: 'POST',
			body: newTransaction,
			json: true
		};

	requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		res.json({ note: 'Transaction created and broadcast successfully.' });
	});
});
//proof of vote/authority(every node has equal power)
app.get('/initiatepod',(req,res)=>{
	//for starting pod
	tincture.blockCreator=null
	console.log(tincture.networkNodes)
	let urls=tincture.networkNodes;
	// urls.push(tincture.currentNodeUrl);
	let requestPromises=[]
	urls.forEach(networkNodeUrl=>{
		const requestOptions = {
			uri: networkNodeUrl + '/pod',
			method: 'GET'
			// body: {delegate:chosenDelegate},
			// json: true
		};
		requestPromises.push(rp(requestOptions));
	})
	const request2={
			uri: tincture.currentNodeUrl + '/pod',
			method: 'GET'
		};
	requestPromises.push(rp(request2))

	Promise.all(requestPromises)
	.then(data => {
		console.log("0.1");
		console.log(data)
		let compres=[]
		data.forEach(obj1=>{
			compres.push(JSON.parse(obj1))
		})
		res.status(200).json({ note: 'pod done',data:compres });
	});	
})


app.get('/pod',(req,res)=>{
	if(tincture.networkNodes.length===0){
		const lastBlock = tincture.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transactions: tincture.pendingTransactions,
		index: lastBlock['index'] + 1
	};
	const blockHash = tincture.hashBlock(previousBlockHash, currentBlockData,0);
	const newBlock = tincture.createNewBlock(0, blockHash,previousBlockHash);
	// tincture.chain.push(newBlock)
	res.status(200).json({data:newBlock,message:"block created successfully"})
	}else{
		console.log("starting")
		let chosenDelegate = tincture.networkNodes[Math.floor(Math.random()*tincture.networkNodes.length)]
		const requestOptions = {
			uri: tincture.currentNodeUrl + '/broadcast/vote',
			method: 'POST',
			body: {delegate:chosenDelegate},
			json: true
		}; 
		console.log("2") 
		console.log("3")

		rp(requestOptions).then(obj=>{
			console.log("4")
			max=Object.keys(tincture.chosenDelegates)[0]
			Object.keys(tincture.chosenDelegates).forEach(value=>{
				if(tincture.chosenDelegates[value]>tincture.chosenDelegates[max]){
					max=value
				}
			})
			tincture.blockCreator=max;
			if(tincture.blockCreator===tincture.currentNodeUrl){
				const lastBlock = tincture.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transactions: tincture.pendingTransactions,
		index: lastBlock['index'] + 1
	};
	const blockHash = tincture.hashBlock(previousBlockHash, currentBlockData,0);
	const newBlock = tincture.createNewBlock(0, blockHash,previousBlockHash);
	// tincture.chain.push(newBlock)
	let requestPromises=[]
	tincture.networkNodes.forEach(nodeUrl=>{
		const requestOptions = {
			uri: nodeUrl + '/receive-new-block',
			method: 'POST',
			body: {newBlock:newBlock},
			json: true
		};
		requestPromises.push(rp(requestOptions));
	})
	Promise.all(requestPromises)
	.then(obj=>{
		res.status(200).json({data:newBlock,message:`block created successfully by ${tincture.currentNodeUrl}` })
	})
	.catch(err=>{ 
		console.log(err.body)
	})
			}else{
				res.status(200).json({message:`${tincture.currentNodeUrl} waiting for new block from ${tincture.blockCreator}`})

			}
		})
		// Promise.all(requestPromises)
		// .then(obj=>{
			
		// })
		// .catch(err=>{
		// 	console.log(err)  
		// })
	}
})

app.post('/broadcast/vote',(req,res)=>{
	console.log(req.body)
	let chosenDelegate=req.body.delegate;
	let requestPromises=[]
	tincture.networkNodes.forEach(networkNodeUrl => {
		console.log("5")
		const requestOptions = {
			uri: networkNodeUrl + '/voteAccept',
			method: 'POST',
			body: {delegate:chosenDelegate},
			json: true
		};
		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		console.log("6")
		res.json({ note: 'Vote created and broadcast successfully.' });
	});
})

app.post("/voteAccept",(req,res)=>{
	let delegate=req.body.delegate;
	console.log("7")
	if(Object.keys(tincture.chosenDelegates).includes(delegate)){
		tincture.chosenDelegates[delegate]+=1;
	}else{
		tincture.chosenDelegates[delegate]=1;
	}
	res.status(200).json({note:"vote accepted"});
})


/////
//state sync routes
app.post("/syncStateSingle",(req,res)=>{
	let networkNode = req.body.networkNode;
	const requestOptions = {
		uri: networkNode + '/recieveState',
			method: 'POST',
			body: tinctureState.data,
			json: true
	}
	rp(requestOptions).then(res1=>{
		res.json({note:"state send"});
	})
	.catch(err=>{
		res.json({note:"state send error"})
	})
})
app.get("/syncState",(req,res)=>{
	let message = tinctureState.data;
	const requestPromises = [];
	tincture.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/recieveState',
			method: 'POST',
			body: message,
			json: true
		};
 
		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		res.json({ note: 'state sync complete' });
	});
})

app.post("/recieveState",(req,res)=>{
	let newState=req.body;
	tinctureState.data=newState;
	res.status(200).json({note:"state recieved and updated successfully"});
})

//////

// mine a block
app.get('/mine', function(req, res) {
	const lastBlock = tincture.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transactions: tincture.pendingTransactions,
		index: lastBlock['index'] + 1
	};
	const nonce = tincture.proofOfWork(previousBlockHash, currentBlockData);
	const blockHash = tincture.hashBlock(previousBlockHash, currentBlockData, nonce);
	const newBlock = tincture.createNewBlock(nonce, previousBlockHash, blockHash);

	const requestPromises = [];
	tincture.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/receive-new-block',
			method: 'POST',
			body:  { newBlock: newBlock },
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		const requestOptions = {
			uri: tincture.currentNodeUrl + '/valueTransaction/broadcast',
			method: 'POST',
			body: {
				amount: 12.5,
				sender: "00",
				recipient: nodeAddress
			},
			json: true
		};
		return rp(requestOptions);
	})
	.then(data => {

		// addStatePersistance(JSON.stringify(tinctureState.data.songs));
		// addPersistanceInBetween(tincture.chain)
		res.json({
			note: "New block mined & broadcast successfully",
			block: newBlock
		});
	});
});

//
//broadcast endpoints
//

// receive new block
app.post('/receive-new-block', function(req, res) {
	const newBlock = req.body.newBlock;
	const lastBlock = tincture.getLastBlock();
	const correctHash = lastBlock.hash === newBlock.previousBlockHash;
	const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

	if (correctHash && correctIndex) {
		tincture.chain.push(newBlock);
		tincture.pendingTransactions = [];
		res.json({
			note: 'New block received and accepted.',
			newBlock: newBlock
		});
	} else {
		res.json({
			note: 'New block rejected.',
			newBlock: newBlock
		});
	}
});


// register a node and broadcast it to the network
app.post('/register-and-broadcast-node', function(req, res) {
	const newNodeUrl = req.body.newNodeUrl;
	if (tincture.networkNodes.indexOf(newNodeUrl) == -1) tincture.networkNodes.push(newNodeUrl);

	const regNodesPromises = [];
	tincture.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/register-node',
			method: 'POST',
			body: { newNodeUrl: newNodeUrl },
			json: true
		};
		regNodesPromises.push(rp(requestOptions));
	});

	Promise.all(regNodesPromises)
	.then(data => {
		const bulkRegisterOptions = {
			uri: newNodeUrl + '/register-nodes-bulk',
			method: 'POST',
			body: { allNetworkNodes: [ ...tincture.networkNodes, tincture.currentNodeUrl ] },
			json: true
		};

		return rp(bulkRegisterOptions);
	})
	.then(data => {
		res.json({ note: 'New node registered with network successfully.' });
	});
});

// register a node with the network
app.post('/register-node', function(req, res) {
	const newNodeUrl = req.body.newNodeUrl;
	const nodeNotAlreadyPresent =tincture.networkNodes.indexOf(newNodeUrl) == -1;
	const notCurrentNode =tincture.currentNodeUrl !== newNodeUrl;
	if (nodeNotAlreadyPresent && notCurrentNode)tincture.networkNodes.push(newNodeUrl);
	res.json({ note: 'New node registered successfully.' });
});


// register multiple nodes at once
app.post('/register-nodes-bulk', function(req, res) {
	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl => {
		const nodeNotAlreadyPresent =tincture.networkNodes.indexOf(networkNodeUrl) == -1;
		const notCurrentNode =tincture.currentNodeUrl !== networkNodeUrl;
		if (nodeNotAlreadyPresent && notCurrentNode)tincture.networkNodes.push(networkNodeUrl);
	});

	res.json({ note: 'Bulk registration successful.' });
});
////
//node status
app.get("/nodeStatus",(req,res)=>{
	res.status(200).json({node:tincture.currentNodeUrl})
})

////
// consensus
app.get('/consensus', function(req, res) {
	const requestPromises = [];
	tincture.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/blockchain',
			method: 'GET',
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});
 
	Promise.all(requestPromises)
	.then(blockchains => {
		const currentChainLength =tincture.chain.length;
		let maxChainLength = currentChainLength;
		let newLongestChain = null;
		let newPendingTransactions = null;

		blockchains.forEach(blockchain => {
			if (blockchain.chain.length > maxChainLength) {
				maxChainLength = blockchain.chain.length;
				newLongestChain = blockchain.chain;
				newPendingTransactions = blockchain.pendingTransactions;
			};
		});


		if (!newLongestChain || (newLongestChain && !tincture.chainIsValid(newLongestChain))) {
			res.json({
				note: 'Current chain has not been replaced.',
				chain:tincture.chain
			});
		}
		else {
			tincture.chain = newLongestChain;
			tincture.pendingTransactions = newPendingTransactions;
			res.json({
				note: 'This chain has been replaced.',
				chain:tincture.chain
			});
		}
	});
});


// get block by blockHash
app.get('/block/:blockHash', function(req, res) {
	const blockHash = req.params.blockHash;
	const correctBlock = tincture.getBlock(blockHash);
	res.json({
		block: correctBlock
	});
});

app.get('/transaction/listPending',(req,res)=>{
	res.status(200).json({data:tincture.pendingTransactions});
})

// get transaction by transactionId
app.get('/transaction/:transactionId', function(req, res) {
	const transactionId = req.params.transactionId;
	const trasactionData = tincture.getTransaction(transactionId);
	res.json({
		transaction: trasactionData.transaction,
		block: trasactionData.block
	});
});
app.get("/networkNodes",(req,res)=>{
	res.status(200).json({data:tincture.networkNodes});
})




// let port1 = process.env.PORT|3000
app.listen(port1,()=>{
	console.log(`listening on ${port1}`);
	if(tincture.currentNodeUrl!==tincture.bootstrapNode){
	const requestOptions = {
		uri: tincture.bootstrapNode + '/register-and-broadcast-node',
		method: 'POST',
		body: { newNodeUrl: tincture.currentNodeUrl },
		json: true
	};
	rp(requestOptions).then(obj=>{
		console.log("connected to the network");
		//syncing chain data
		
			const requestOptions2={
				uri: tincture.bootstrapNode + '/blockchain',
				method: 'GET'
			}
			rp(requestOptions2).then(data=>{
				let newData=JSON.parse(data)
				let blockchain=newData.data;
				tincture.chain=blockchain;
				console.log("chain synced")
			})
			.catch(err=>{
				console.log("chain error",err)
			})
			//syncing chain state
			const requestOptions1 = {
				uri: tincture.bootstrapNode + '/syncStateSingle',
				method: 'POST',
				body:{networkNode:tincture.currentNodeUrl},
				json:true
			};
			rp(requestOptions1).then(res1=>{
				console.log("state synced");
			})
			.catch(err=>{
				console.log("error",err)
			})
		
		
	})
	.catch(err=>{
	console.log("connection error");
	})
}
})

let express = require("express");
let app = express();
let uuid = require("uuid/v1");
let {BlockChain} = require("../Blockchain/BlockChain");
const rp = require('request-promise');

let tincture=new BlockChain()


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/",(req,res)=>{
  res.status(200).json({message:"start interface"});
})

//
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
  const blockIndex = tincture.addTransactionToPendingTransactions(newTransaction)
})
//value transaction broadcast
app.post('/valueTransaction/broadcast', function(req, res) {
	const newTransaction = tincture.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
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

//data storge transaction broadcast
app.post('/dataTransaction/broadcast', function(req, res) {
	const newTransaction = tincture.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
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
			body: { newBlock: newBlock },
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		const requestOptions = {
			uri: tincture.currentNodeUrl + '/transaction/broadcast',
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


// get transaction by transactionId
app.get('/transaction/:transactionId', function(req, res) {
	const transactionId = req.params.transactionId;
	const trasactionData = tincture.getTransaction(transactionId);
	res.json({
		transaction: trasactionData.transaction,
		block: trasactionData.block
	});
});





let port = process.env.PORT|3000
app.listen(port,()=>{
  console.log(`listening on ${port}`);
})

let express = require("express");
let app = express();
let uuid = require("uuid/v1");
let {BlockChain} = require("../Blockchain/BlockChain");

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
app.post('/transaction/broadcast', function(req, res) {
	const newTransaction = tincture.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
	tincture.addTransactionToPendingTransactions(newTransaction);
	const requestPromises = [];
	tincture.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/transaction',
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
app.post('/transaction/broadcast', function(req, res) {
	const newTransaction = tincture.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
	tincture.addTransactionToPendingTransactions(newTransaction);

	const requestPromises = [];
	tincture.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/transaction',
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


let port = process.env.PORT|3000
app.listen(port,()=>{
  console.log(`listening on ${port}`);
})

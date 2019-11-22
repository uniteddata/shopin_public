const cors = require("cors");
const bodyParser = require("body-parser");
const initializeNode = require("./startup/initializeNode");
const Transactions = require("./controller/transaction.controller");
const Wallets = require("./controller/wallets.controller");
const storeDataToAllNode = require("./startup/updateContacts");

const blsInit = require('./bls/init')
const bls = require('./bls/bls')


// import io from 'socket.io';
// import http from 'http';

console.log(process.argv, 'environment')

var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);

// const server = http.createServer();
// const expressWs1 = expressWs(app);

app.use(cors());
app.use(bodyParser.json());

console.log("here");

// console.log(app.ws)

blsInit().then(() => {

  // create and initialize network between nodes
  initializeNode().then(result => {

    app.post('/bls', (req, res) => {

      const k = 4
      const n = 10
      const msg = 'this is a pen'
      const msk = []
      const mpk = []
      const idVec = []
      const secVec = []
      const pubVec = []
      const sigVec = []
      const mskInStr = []

      /*
        setup master secret key
      */
      for (let i = 0; i < k; i++) {
        const sk = new bls.SecretKey()
        sk.setByCSPRNG()
        msk.push(sk)

        const pk = sk.getPublicKey()
        mpk.push(pk)
      }

      const secStr = msk[0].serializeToHexStr()
      result.node.contact.sk = secStr
      const pubStr = mpk[0].serializeToHexStr()
      const sigStr = msk[0].sign(msg).serializeToHexStr()

      msk.forEach((each) => {
        const secStr = each.serializeToHexStr()
        mskInStr.push(secStr)
      })

      const sk = new bls.SecretKey()
      sk.deserializeHexStr(secStr)

      // console.log(msk[0], sk)

      storeDataToAllNode({ key: "DKG", value: mskInStr }, result.node)

      res.send({
        status: "success"
      })

      /*
        key sharing
      */
      // for (let i = 0; i < n; i++) {
      //   const id = new bls.Id()
      //   //    blsIdSetInt(id, i + 1)
      //   id.setByCSPRNG()
      //   idVec.push(id)
      //   const sk = new bls.SecretKey()
      //   sk.share(msk, idVec[i])
      //   secVec.push(sk)

      //   const pk = new bls.PublicKey()
      //   pk.share(mpk, idVec[i])
      //   pubVec.push(pk)

      //   const sig = sk.sign(msg)
      //   sigVec.push(sig)
      // }

      // /*
      //   recover
      // */
      // const idxVec = [2, 4, 5, 7]
      // console.log('idxVec=' + idxVec)
      // let subIdVec = []
      // let subSecVec = []
      // let subPubVec = []
      // let subSigVec = []
      // for (let i = 0; i < idxVec.length; i++) {
      //   let idx = idxVec[i]
      //   subIdVec.push(idVec[idx])
      //   subSecVec.push(secVec[idx])
      //   subPubVec.push(pubVec[idx])
      //   subSigVec.push(sigVec[idx])
      // }
      // {
      //   const sec = new bls.SecretKey()
      //   const pub = new bls.PublicKey()
      //   const sig = new bls.Signature()

      //   sec.recover(subSecVec, subIdVec)
      //   pub.recover(subPubVec, subIdVec)
      //   sig.recover(subSigVec, subIdVec)
      //   console.log(sig.serializeToHexStr(), sigStr)
      //   // assert(sec.serializeToHexStr(), secStr)
      //   // assert(pub.serializeToHexStr(), pubStr)
      //   // assert(sig.serializeToHexStr(), sigStr)
      // }

    })





    app.post("/check/signature", (req, response) => {
      const message = req.body.balance;
      const messageHash = result.EthCrypto.hash.keccak256(message);

      const signature = result.EthCrypto.sign(
        req.body.privateKey, // privateKey
        messageHash // hash of message
      );
      response.send({
        status: "success",
        data: signature
      });
    });

    // transaction between wallets
    app.post("/feed/wallets", (req, res) => {
      console.log("request recieved");
      console.log(req.body);
      Transactions.makeTransactions(
        req,
        res,
        result.node,
        result.ethIdentitiy,
        result.EthCrypto
      );
    });

    // get transactions history
    app.post("/node/data", (req, res) => {
      Transactions.getTransactionHistory(req.body.key, res, result.node, result.ethIdentitiy);
    });

    app.get("/wallets", (req, res) => {
      Wallets.getWallets(res, result.node, result.ethIdentitiy);
    });

    io.on("connection", function (socket) {
      // get wallet list
      socket.on("getWallets", () => {
        Wallets.getWallets(io, result.node, result.ethIdentitiy);
      });

      // get transaction log
      socket.on("getTransactionLog", key => {
        console.log("here");
        Transactions.getTransactionHistory(io, result.node, result.ethIdentitiy);
      });

      socket.on("transaction", request => {
        console.log("request recieved", request);
        let req = {};
        req.body = request;
        Transactions.makeTransactions(
          req,
          io,
          result.node,
          result.ethIdentitiy,
          result.EthCrypto
        );
      });
    });
  });
})

server.listen(process.argv[2]);

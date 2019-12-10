const cors = require("cors");
const bodyParser = require("body-parser");
const initializeNode = require("./startup/initializeNode");
const Transactions = require("./controller/transaction.controller");
const Wallets = require("./controller/wallets.controller");
const connectionToMongo = require('./startup/mongoDb')

require('events').EventEmitter.defaultMaxListeners = 25;

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

let isPrevCompleted = true

console.log("here");

// console.log(app.ws)

connectionToMongo().then((db) => {
  // create and initialize network between nodes
  initializeNode(db).then(result => {
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

    app.get("/tokens", (req, res) => {
      db.collection("tokens").find().sort({ $natural: -1 }).toArray((err, data) => {
        res.send({
          status: "success",
          data: data
        });
      })
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



      socket.on("newToken", request => {

        io.emit('newTokenReceived', {
          status: "success",
          data : request,
        })

        console.log("here", request)

        if (isPrevCompleted) {

          console.log("new token", isPrevCompleted)


          return db.collection("tokens").find({ status: 'pending' }).toArray(async (err, res) => {
            isPrevCompleted = false
            console.log(err, res, isPrevCompleted)

            for (const [i, token] of res.entries()) {
              console.log(token, "token", i)

              // if (i == 0) {
              await handler()
              await new Promise((done) => setTimeout(done, 20000))
              // } else {
              //   await setTimeout(handler, 30000)
              // }


              // setTimeout(handler, 20000)

              // handler()

              async function handler() {
                return new Promise((resolve, reject) => {

                  return result.node.iterativeFindValue(result.ethIdentitiy.address.substring(2), function (
                    _err,
                    _data
                  ) {

                    console.log(_data.value)
                    if (_data && _data.value) {
                      // console.log("wallet data not stored from initialize", _err);


                      var timesRun = 0;
                      var interval = setInterval(() => {
                        let self = this;

                        if (_data.value.length > 0) {

                          let currentClient = _data.value[Math.floor((Math.random() * _data.value.length))];
                          let selectedClient = _data.value[Math.floor((Math.random() * _data.value.length))];
                          let balance = Math.floor(Math.random() * 10) + 1

                          const message = balance
                          const messageHash = result.EthCrypto.hash.keccak256(message);
                          let signature = result.EthCrypto.sign(
                            currentClient.privateKey, // privateKey
                            messageHash // hash of message
                          );

                          if (currentClient.name !== selectedClient.name) {
                            timesRun += 1;

                            if (timesRun === (request.value + 1)) {
                              clearInterval(interval);
                              return db.collection("tokens").updateOne({ _id: token._id }, { $set: { status: 'completed' } }, async (err, res) => {
                                resolve(true);
                                
                              })
                            }
                            if (currentClient.identity && currentClient.identity) {
                              let obj = { from: currentClient.identity, to: selectedClient.identity, balance: parseInt(balance), signature };
                              obj.tokenInfo = token
                              obj.number = timesRun
                              if (timesRun == request.value){
                                obj.isLast = true  
                              }
                              

                              if (timesRun == 5 || timesRun == 8 || timesRun == 12) {
                                obj.signature = obj.signature.substring(1);
                                // this.props.AddTransation(currentClient, selectedClient, balance, signature.substring(1));
                                console.log("request recieved", token);
                                let req = {};
                                req.body = obj;
                                Transactions.makeTransactions(
                                  req,
                                  io,
                                  result.node,
                                  result.ethIdentitiy,
                                  result.EthCrypto
                                );


                              } else {

                                console.log("request recieved", token);

                                let req = {};
                                req.body = obj;
                                Transactions.makeTransactions(
                                  req,
                                  io,
                                  result.node,
                                  result.ethIdentitiy,
                                  result.EthCrypto
                                );
                                // this.props.AddTransation(currentClient, selectedClient, balance, signature);
                              }
                            }
                          }
                        }

                      }, 300)

                    } else {
                      console.log("wallet data stored from initialize");
                    }
                  })
                })


              }
            }

            isPrevCompleted = true

          })
        }



      }
      );
    })



  });
});

server.listen(process.argv[2]);

const kadence = require("../../@deadcanaries/kadence/index.js");
const levelup = require("levelup");
const encoding = require("encoding-down");
const memdown = require("memdown");
const bunyan = require("bunyan");
const config = require("../config/config");
const fs = require("fs")
const EthCrypto = require("eth-crypto");
const updateContactList = require("./updateContacts");
const bls = require("../bls/bls");


const storage = levelup(encoding(memdown()));
const logger = bunyan.createLogger({ name: "main" });
const transport = new kadence.UDPTransport();

const ethIdentitiy = EthCrypto.createIdentity();
const id = process.argv[3] == "true"
  ? config.primaryNodeAddress
  : ethIdentitiy.address.substring(2);

console.log(id, typeof (process.argv[3]));

// FILE READING

function initializeNode() {
  return new Promise((resolve, reject) => {
    setTimeout(
      function startWithThis() {
        let filename = "./ip.txt";
        let ipAddress;
        return fs.readFile(filename, "utf8", function (err, data) {
          if (err) throw err;
          ipAddress = data.replace(/(\r\n\t|\n|\r\t)/gm, "");
          console.log(ipAddress);
          if (process.argv[3] == 'false') {
            console.log(
              "Master node: " +
              process.argv[6] +
              "\nPrimary Node's Port:" +
              process.argv[4] +
              "\nThis node's port: " +
              process.env.PORT
            );
          }

          const node = new kadence.KademliaNode({
            identity: id,
            contact: {
              hostname: ipAddress,
              port: process.argv[3] == "true"
                ? process.argv[4]
                : process.argv[2],
              publicKey: ethIdentitiy.publicKey,
              isMaster: process.argv[6] == "true" ? process.argv[6] : false,
              isPrimary: process.argv[3] == "true"
                ? process.argv[3]
                : false,
              balance: process.argv[5],
              clients: [],
              failTransactions: [],
              successfulTransactions: [],
              msk: {},
              mpk: {},
            },
            transport: transport,
            storage: storage,
            logger: logger
          });

          console.log(
            node.contact.port,
            node.contact.hostname,
            process.argv[3]
          );

          node.listen(node.contact.port);

          node.quasar = node.plugin(kadence.quasar());

          let _walletSeeds = JSON.parse(
            fs.readFileSync(process.cwd() + (process.cwd().includes("/unity-node-repo") ? '' : "/unity-node-repo/") + "/src/config/seed.json", "utf8")
          );

          node.iterativeStore(
            ethIdentitiy.address.substring(2),
            _walletSeeds,
            function (_err, _data) {
              if (_err) {
                // console.log("wallet data not stored from initialize", _err);
              } else {
                console.log("wallet data stored from initialize");
              }
            }
          );


          // const plugin = kadence.rolodex("./rolodex")(node);
          // middleware
          node.use((request, response, next) => {

            if (request.method == "AGGREGATE_ALL_SHARES") {
              console.log(req.params, "signature")
              response.send("abc")
            }


            if (request.method == "SEND_TRANSACTION_TO_LEADER") {
              const sk = new bls.SecretKey()
              sk.deserializeHexStr(node.contact.sk)
              // console.log(JSON.stringify(req.params))

              const string = request.params.from + " is sending " + request.params.balance + " to " + request.params.to
              console.log(string)

              const sign = sk.sign(string)
              // console.log(sk)


              // node.quasar.quasarPublish("SEND_DATA_TO_NETWORK", data, (err, del) => { console.log(del.length)});
              // node.router.allBuckets.forEach((contact) => {
              node.quasar.quasarPublish("GENERATE_SHARE", string, (err, res) => {
                console.log(err, res)
              })

              node.contact.sign = sign.serializeToHexStr()

              // })


              // response.send({ sign: sign.serializeToHexStr() })
            }
            // console.log(request)
            if (process.argv[3] == "true") {
              if (request.method === "FIND_NODE") {
                node.join([request.identity, request.contact], () => { });
                // }
              }
            }

            if (
              request.method === "PUBLISH" &&
              request.params.topic === "UPDATE_CONTACT_LIST"
            ) {
              node._updateContact(
                request.params.contents.identity,
                request.params.contents.contact
              );
            }




            // if (
            //   request.method === "PUBLISH" &&
            //   request.params.topic === "SEND_DATA_TO_NETWORK"
            // ) {
            //   // node._updateContact(
            //   //   request.params.contents.identity,
            //   //   request.params.contents.contact
            //   // );
            //   console.log(request.params, "request.contact.params")
            // }


            next();
          });

          node.quasar.quasarSubscribe("GENERATE_SHARE", (req) => {

            if (node.contact.isMaster != "true") {
              // console.log(req)

              const sk = new bls.SecretKey()
              sk.deserializeHexStr(node.contact.sk)

              const sig = sk.sign(req)
              console.log(sig, "In GENERATE_SHARE")
              console.log("______________________***************************************^%%%%%%%%%%%%%%%%%%%%%%#$$$$$$$$$$$$$$$$$$$$$$$$$^^^^^^^^^^^^^^^^^^")


              node.send("AGGREGATE_ALL_SHARES",
                sig.serializeToHexStr(),
                [config.primaryNodeAddress, config.contact], (err, response) => {
                  console.log(err)
                })

            }
          })

          node.quasar.quasarSubscribe("SEND_DATA_TO_NETWORK", (data) => {
            console.log("SEND_DATA_TO_NETWORK")
            if (data.key == "DKG") {
              const msk = []

              data.value.forEach((each) => {
                const sk = new bls.SecretKey()
                sk.deserializeHexStr(each)
                msk.push(sk)
              })
              const id = new bls.Id()
              id.setByCSPRNG()
              let sk = new bls.SecretKey()

              sk.share(msk, id)
              node.contact.sk = sk.serializeToHexStr()
              node.contact.blsId = id.serializeToHexStr()
              console.log(node.contact.sk, "node.contact.sk")
            }

            // node.send('GENERATE_SHARE', 'hello', (err, res) => console.log('success'))
          })

          // node.use("GENERATE_SHARE", (req, res, next) => {

          //   console.log(req.params)

          //   const sk = new bls.SecretKey()
          //   sk.deserializeHexStr(node.contact.sk)

          //   const sig = sk.sign(req.params)
          //   console.log(sig, "In GENERATE_SHARE")
          //   // sigVec.push(sig)

          // })

          node.use("CONTACT_LIST", (req, res, next) => {
            if (process.argv[3] == "true") {
              let masters = 0;

              logger.info(`Connected  ${node.router.size + 1} peers!`);

              console.log();
              console.log(
                "------------- CURRENT NODES OF NETWORKS----------->"
              );
              console.log("  ");

              node.router.allBuckets.length > 0 &&
                node.router.allBuckets.length > 0
                ? node.router.allBuckets.forEach(val => {
                  if (val.contact.isMaster === "true") {
                    masters++;
                  }

                  // );
                })
                : "";
              console.log(node.router.allBuckets, masters);
              console.log("  ");
              console.log("<------------------------------------------------");
              console.log(" ");

              console.log(
                "There is " +
                masters +
                " master nodes in network from " +
                (node.router.allBuckets.length + 1) +
                " total nodes."
              );
              node.router.addContactByNodeId(request.contact[1]);
            } else {
              let masters = 0;

              logger.info(`Connected  ${node.router.size} peers!`);

              console.log();
              console.log(
                "------------- CURRENT NODES OF NETWORKS----------->"
              );
              console.log("  ");

              req.params.length > 0
                ? req.params.forEach(val => {
                  if (val.contact.isMaster === "true") {
                    masters++;
                  }

                  // );
                })
                : "";

              console.log(node.router.allBuckets, masters);
              console.log("  ");
              console.log("<------------------------------------------------");
              console.log(" ");
              console.log(
                "There is " +
                masters +
                " master nodes in network from " +
                node.router.size +
                " total nodes."
              );
            }
            next();
          });

          node.use("SEND_TRANSACTION_TO_MASTER", async (req, res, next) => {
            let key = kadence.utils.getRandomKeyString();

            const encryptedObject = EthCrypto.cipher.parse(
              req.params.encryptedData
            );

            const decrypted = await EthCrypto.decryptWithPrivateKey(
              req.params.privateKey,
              encryptedObject
            );
            const decryptedPayload = JSON.parse(decrypted);

            let senderClientBalance;
            let senderNodeContact = {};
            let receiverNodeContact = {};
            let receiverWallet, senderWallet;
            if (req.params.for) {
              node.router.allBuckets && node.router.allBuckets.length > 0
                ? node.router.allBuckets.forEach(val => {
                  if (
                    val.identity == req.params.receiver.receiverNodeIdentity
                  ) {
                    val.contact.clients.length > 0 &&
                      val.contact.clients.forEach(receiverNode => {
                        if (req.params.to.address == receiverNode.identity) {
                          receiverNodeContact = val;
                          receiverWallet = receiverNode;
                        }
                      });
                  }

                  if (val.identity == req.params.senderIdentity) {
                    val.contact.clients.length > 0 &&
                      val.contact.clients.forEach(senderNode => {
                        if (req.params.from.address == senderNode.identity) {
                          senderNodeContact = val;
                          senderClientBalance = senderNode.balance;
                          senderWallet = senderNode;
                        }
                      });
                  }

                  //  }
                })
                : "";

              if (decryptedPayload.message > parseInt(senderClientBalance)) {
                node.iterativeStore(key, encryptedObject, function (
                  err,
                  totalStored
                ) { });

                res.send({
                  status: "error",
                  message: "requested client doesn't have enough balance",
                  key
                });
              } else {
                senderWallet.balance =
                  Number(senderWallet.balance) -
                  Number(decryptedPayload.message);
                receiverWallet.balance =
                  Number(receiverWallet.balance) +
                  Number(decryptedPayload.message);

                senderNodeContact.contact.clients &&
                  senderNodeContact.contact.clients.length > 0 &&
                  senderNodeContact.contact.clients.forEach((wallet, index) => {
                    if (wallet.identity == senderWallet.identity) {
                      senderNodeContact.contact.clients[index] = senderWallet;
                    }
                  });

                receiverNodeContact.contact.clients &&
                  receiverNodeContact.contact.clients.length > 0 &&
                  receiverNodeContact.contact.clients.forEach(
                    (wallet, index) => {
                      if (wallet.identity == receiverWallet.identity) {
                        receiverNodeContact.contact.clients[
                          index
                        ] = receiverWallet;
                      }
                    }
                  );

                let updateContacts = [
                  {
                    contact: senderNodeContact.contact,
                    identity: senderNodeContact.identity
                  },
                  {
                    contact: receiverNodeContact.contact,
                    identity: receiverNodeContact.identity
                  }
                ];

                updateContacts.forEach(latestContact => {
                  updateContactList(latestContact, node);
                });

                node.iterativeStore(key, encryptedObject, function (
                  err,
                  totalStored
                ) { });

                res.send({
                  status: "success",
                  message: "Transaction Succeed",
                  key
                });
              }
            } else {
              node.router.allBuckets && node.router.allBuckets.length > 0
                ? node.router.allBuckets.forEach(val => {
                  // searching exact node from routing table
                  if (req.params.sender == val.identity.toString("hex")) {
                    if (
                      decryptedPayload.message > parseInt(val.contact.balance)
                    ) {
                      node.iterativeStore(key, encryptedObject, function (
                        err,
                        totalStored
                      ) { });

                      res.send({
                        status: "error",
                        message:
                          "requested client doesn't have enough balance",
                        key
                      });
                    } else {
                      val.contact.balance =
                        Number(val.contact.balance) -
                        Number(decryptedPayload.message);
                      req.contact[1].balance =
                        Number(val.contact.balance) +
                        Number(decryptedPayload.message);

                      let updateContacts = [
                        {
                          contact: val.contact,
                          identity: val.identity
                        },
                        {
                          contact: req.contact[1],
                          identity: req.contact[0]
                        }
                      ];

                      updateContacts.forEach(latestContact => {
                        updateContactList(latestContact, node);
                      });

                      node.iterativeStore(key, encryptedObject, function (
                        err,
                        totalStored
                      ) {
                        console.log(totalStored, "data stored");
                      });

                      res.send({
                        status: "success",
                        message: "Transaction Succeed",
                        key
                      });
                    }
                  }
                })
                : "";
            }

            // if(senderAddress){

            // // }
            // // else {
            // //   res.send({
            // //     status: "error",
            // //     message: "Receiver is not verified."
            // //   });
            // }
          });

          node.use("VERIFY_TRANSACTION", async (req, res, next) => {
            //
            console.log("Processing transaction");

            const encryptedObject = EthCrypto.cipher.parse(
              req.params.encryptedData
            );

            const decrypted = await EthCrypto.decryptWithPrivateKey(
              req.params.privateKey,
              encryptedObject
            );

            const decryptedPayload = JSON.parse(decrypted);

            console.log(
              decryptedPayload.message > parseInt(req.contact[1].balance)
                ? "-----------not a valid transaction------------"
                : ""
            );

            let masters = [];
            node.router.allBuckets && node.router.allBuckets.length > 0
              ? node.router.allBuckets.forEach(val => {
                if (val.contact.isMaster === "true") {
                  masters.push(val);
                }
              })
              : "";

            if (!masters.length) {
              let key = kadence.utils.getRandomKeyString();

              node.iterativeStore(key, encryptedObject, function (
                err,
                totalStored
              ) {
                console.log(totalStored, "data stored");
              });

              res.send({
                status: "error",
                code: 404,
                message: "No master node found",
                key
              });
            } else {
              let masterNode =
                masters[Math.floor(Math.random() * masters.length)];
              req.params.sender = req.params.for
                ? req.params.sender
                : req.contact[0];

              node.send(
                "SEND_TRANSACTION_TO_MASTER",
                req.params,
                [masterNode.identity, masterNode.contact],
                (error, result) => {
                  if (!result.contact) {
                    res.send(result);
                  }
                }
              );
            }

            //   if (req.params.for !== "client") {
            //     req.contact[1].balance =
            //       Number(req.contact[1].balance) -
            //       Number(decryptedPayload.message);
            //   } else {
            //     req.contact[1].clients.length > 0
            //       ? req.contact[1].clients.forEach(requestedClient => {
            //           if (requestedClient.identity === req.params.from.address) {
            //             requestedClient.balance =
            //               Number(requestedClient.balance) -
            //               Number(decryptedPayload.message);
            //           }
            //         })
            //       : "";
            //   }

            //   node.router.removeContactByNodeId(req.contact[0]);
            //   node.router.addContactByNodeId(req.contact[0], req.contact[1]);

            //   node.contact.balance =
            //     Number(node.contact.balance) + Number(decryptedPayload.message);

            //   res.send({
            //     contact: req.contact[1],
            //     identity: req.contact[0]
            //   });
            // }
            // }
            // else {
            //   res.send({
            //     status: "error",
            //     message: "Receiver is not verified."
            //   });
            // }
          });

          node.use("ECHO", (req, res, next) => {
            console.log("------------- MESSAGE----------->");
            console.log("  ");

            console.log(
              "Got message : " +
              req.params.message +
              " \nfrom : " +
              req.contact[0]
            );
            console.log("  ");
            console.log("<------------------------------------------------");

            res.send(node.router.allBuckets);
          });

          node.sendNeighborEcho = (neighbor, text, callback) => {
            node.send("ECHO", { message: text }, neighbor, callback);
          };

          node.use("STORE", (request, response, next) => {


            console.log(request, "store");
            // let [key, entry] = request.params;
            // let hash = crypto
            //   .createHash("rmd160")
            //   .update(entry.value)
            //   .digest("hex");
            // // Ensure values are content-addressable
            // if (key !== hash) {
            //   return next(new Error("Key must be the RMD-160 hash of value"));
            // }
          });

          if (process.argv[3] == "false") {
            console.log(config.primaryNodeAddress, config.contact, "config.primaryNodeAddress, config.contact")
            node.join([config.primaryNodeAddress, config.contact], () => {
              node.sendNeighborEcho(
                [config.primaryNodeAddress, config.contact],
                "Hello",
                (err, res) => {
                  console.log(err, res);
                  res.forEach(response => {
                    let nodesToSave = Object.values(response).reverse();
                    node.router.addContactByNodeId(nodesToSave);
                    node.send(
                      "CONTACT_LIST",
                      res,
                      [config.primaryNodeAddress, config.contact],
                      () => { }
                    );
                    node.send(
                      "CONTACT_LIST",
                      res,
                      [nodesToSave[0], nodesToSave[1]],
                      () => { }
                    );
                  });
                }
              );
            });
          }



          resolve({
            node,
            ethIdentitiy,
            EthCrypto
          });
        });
      },
      process.argv[3] == "true" ? 500 : 2000
    );
  });
}

module.exports = initializeNode;

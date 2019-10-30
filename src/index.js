/* 
process.argv[3] -> true/false -> shows the node is first node or not
process.argv[2] -> shows the port of current node
process.argv[4] -> shows the port of first node
*/


const kadence = require("../@kadenceproject/kadence/index.js");
const levelup = require("levelup");
const encoding = require("encoding-down");
const memdown = require("memdown");
const bunyan = require("bunyan");
const EthCrypto = require("eth-crypto");
const fs = require("fs");


const storage = levelup(encoding(memdown()));
const logger = bunyan.createLogger({ name: "main" });
const transport = new kadence.UDPTransport();


var app = require("express")();
var server = require("http").Server(app);

const cors = require("cors");
const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());

const config = require("./config/config");

// eth-crypto library to generate identity

const ethIdentitiy = EthCrypto.createIdentity();
const id = process.argv[3] == "true"
  ? config.primaryNodeAddress
  : ethIdentitiy.address.substring(2);


const node = new kadence.KademliaNode({
  identity: id,
  contact: {
    hostname: "127.0.1.1",
    port: process.argv[3] == "true"
      ? process.argv[4]
      : process.argv[2],
  },
  transport: transport,
  storage: storage,
  logger: logger
});

node.listen(node.contact.port);

console.log("IP: ", node.contact.hostname, "PORT: ", node.contact.port)

node.use((request, response, next) => {
  if (process.argv[3] == "true") {
    if (request.method === "FIND_NODE") {
      node.join([request.identity, request.contact], () => { });
      // }
    }
  }
})


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

let _walletSeeds = JSON.parse(
  fs.readFileSync(process.cwd() + "/src/config/seed.json", "utf8")
);


node.iterativeStore(
  ethIdentitiy.address.substring(2),
  _walletSeeds,
  function (_err, _data) {
    if (_err) {
      console.log("wallet data not stored from initialize");
    }
    console.log("wallet data stored from initialize");
  }
);

if (process.argv[3] == "false") {
  console.log(config.primaryNodeAddress, config.contact, "config.primaryNodeAddress, config.contact")

  node.join([config.primaryNodeAddress, config.contact], () => {
    console.log("sent")
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
            () => {}
          );
          node.send(
            "CONTACT_LIST",
            res,
            [nodesToSave[0], nodesToSave[1]],
            () => {}
          );
        });
      }
    );
  })
}

app.get("/wallets", (req, res) => {
  node.iterativeFindValue(ethIdentitiy.address.substring(2), function (
    _err,
    _data
  ) {
    console.log(_data, _err)
    if (res.status) {
      res.status(200).send({
        status: "success",
        data: _data.value
      })
    }
  })
});

server.listen(process.argv[2]);
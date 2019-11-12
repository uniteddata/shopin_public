const kadence = require("../@kadenceproject/kadence/index.js");
const config = require("./config/config");
const { id, ipAddress, ethIdentitiy, transport, storage, logger, app, server } = require("./index");
function waitForIP() {
  const node = new kadence.KademliaNode({
    identity: id,
    contact: {
      hostname: ipAddress,
      port: process.argv[3] == "true"
        ? process.argv[4]
        : process.argv[2],
    },
    publicKey: ethIdentitiy.publicKey,
    isMaster: process.argv[6] == "true" ? process.argv[6] : false,
    isPrimary: process.argv[3] == "true"
      ? process.argv[3]
      : false,
    balance: process.argv[5],
    clients: [],
    transport: transport,
    storage: storage,
    logger: logger
  });
  node.listen(node.contact.port);
  node.quasar = node.plugin(kadence.quasar());
  console.log("IP: ", node.contact.hostname, "PORT: ", node.contact.port, id);
  node.use((request, response, next) => {
    if (process.argv[3] == "true") {
      if (request.method === "FIND_NODE") {
        node.join([request.identity, request.contact], () => { });
        // }
      }
    }
  });
  node.use("CONTACT_LIST", (req, res, next) => {
    if (process.argv[3] == "true") {
      let masters = 0;
      logger.info(`Connected  ${node.router.size} peers!`);
      console.log();
      console.log("------------- CURRENT NODES OF NETWORKS----------->");
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
      console.log("There is " +
        masters +
        " master nodes in network from " +
        node.router.size +
        " total nodes.");
      node.router.addContactByNodeId(request.contact[1]);
    }
    else {
      let masters = 0;
      logger.info(`Connected  ${node.router.size} peers!`);
      console.log();
      console.log("------------- CURRENT NODES OF NETWORKS----------->");
      console.log("  ");
      req.params.length > 0
        ? req.params.forEach(val => {
          if (val.contact.isMaster === "true") {
            masters++;
          }
          // );
        })
        : "";
      console.log("  ");
      console.log("<------------------------------------------------");
      console.log(" ");
      console.log("There is " +
        masters +
        " master nodes in network from " +
        node.router.size +
        " total nodes.");
    }
    next();
  });
  node.use("ECHO", (req, res, next) => {
    console.log("------------- MESSAGE----------->");
    console.log("  ");
    console.log("Got message : " +
      req.params.message +
      " \nfrom : " +
      req.contact[0]);
    console.log("  ");
    console.log("<------------------------------------------------");
    res.send(node.router.allBuckets);
  });
  node.sendNeighborEcho = (neighbor, text, callback) => {
    node.send("ECHO", { message: text }, neighbor, callback);
  };
  // let _walletSeeds = JSON.parse(
  //   fs.readFileSync(process.cwd() + "/src/config/seed.json", "utf8")
  // );
  // node.iterativeStore(
  //   ethIdentitiy.address.substring(2),
  //   _walletSeeds,
  //   function (_err, _data) {
  //     if (_err) {
  //       console.log("wallet data not stored from initialize");
  //     }
  //     console.log("wallet data stored from initialize");
  //   }
  // );
  if (process.argv[3] == "false") {
    console.log(config.primaryNodeAddress, config.contact, "config.primaryNodeAddress, config.contact");
    node.join([config.primaryNodeAddress, config.contact], () => {
      node.sendNeighborEcho([config.primaryNodeAddress, config.contact], "Hello", (err, res) => {
        console.log(err, res);
        res.forEach(response => {
          let nodesToSave = Object.values(response).reverse();
          node.router.addContactByNodeId(nodesToSave);
          node.send("CONTACT_LIST", res, [config.primaryNodeAddress, config.contact], () => { });
          node.send("CONTACT_LIST", res, [nodesToSave[0], nodesToSave[1]], () => { });
        });
      });
    });
  }
  app.get("/wallets", (req, res) => {
    node.iterativeFindValue(ethIdentitiy.address.substring(2), function (_err, _data) {
      console.log(_data, _err);
      if (res.status) {
        res.status(200).send({
          status: "success",
          data: _data.value
        });
      }
    });
  });
  server.listen(process.argv[2]);
}
exports.waitForIP = waitForIP;

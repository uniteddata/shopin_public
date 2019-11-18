const cors = require("cors");
const bodyParser = require("body-parser");
const initializeNode = require("./startup/initializeNode");

console.log(process.argv, 'environment')

var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);



app.use(cors());
app.use(bodyParser.json());

console.log("here");

// create and initialize network between nodes
initializeNode().then(result => {
  app.get("/wallets", (req, res) => {
    Wallets.getWallets(res, result.node, result.ethIdentitiy);
  });

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

  io.on("connection", function (socket) {
    // get wallet list
    socket.on("getWallets", () => {
      Wallets.getWallets(io, result.node, result.ethIdentitiy);
    });
  });

});

server.listen(process.env.API_PORT);
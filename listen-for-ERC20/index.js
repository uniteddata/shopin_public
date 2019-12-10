const Web3 = require('web3')
// console.log(Web3.fromWei(2000000000000000000, 'ether')) 

const web3 = new Web3('wss://mainnet.infura.io/ws/v3/d75ab9cb284f4536b1da2ce9f8201bdb')
const connectionToMongo = require('./mongoDb')

var io = require('socket.io-client');
var socket = io.connect('http://3.134.240.60:4004', { reconnect: true });

const fs = require('fs');

connectionToMongo().then((db) => {

    // res.send({
    //   status: "success",
    //   data: data
    // });

    // Add a connect listener
    socket.on('connect', function (socket) {
        console.log('Connected!');
    });



    const contract = new web3.eth.Contract(require('./erc20-abi.json'), '0x91eDfC9E48A6F9A2dA28A3DCdAd310fb928641dB')

    contract.events.Transfer()
        .on('data', (event) => {

            console.log(event, "data")
            console.log('transfer', {
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                from: event.returnValues.from,
                to: event.returnValues.to,
                value: Number(event.returnValues.value.substring(0, event.returnValues.value.length-18)),
                contractAddress: event.address,
            })
            

            const request = {
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                from: event.returnValues.from,
                to: event.returnValues.to,
                value: Number(event.returnValues.value.substring(0, event.returnValues.value.length-18)),
                contractAddress: event.address,
                status: 'pending',
                timeStamp: new Date()
            }

            if (request.to === '0xDA090994048AA4afFE37D7F5195e25662d465FB8' || request.to === '0xda078e19B3B5BBc03BA8b67B8326f95a52417f46')
            db.collection("tokens").insert(request, (err, res) => {
                socket.emit('newToken', request);
            })
        })
        .on('error', (err) => {
            console.error(err)
        })
    // })

})


// connectionToMongo().then((db) => {

//     //     // res.send({
//     //     //   status: "success",
//     //     //   data: data
//     //     // });

//     // Add a connect listener
//     socket.on('connect', function (socket) {
//         console.log('Connected!');
//     });
//     let count = 8920335

//     var from = "0xBA826fEc90CEFdf6706858E5FbaFcb27A290Fbe0";
//     var to = "0x1671a3e4A2519A653E66E827ef6eaE690ee86729";

//     function term(str, char) {
//         var xStr = str.substring(0, str.length - 1);
//         return xStr + char;
//     }

//     function stringGen(yourNumber) {
//         var text = "";
//         var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

//         for (var i = 0; i < yourNumber; i++)
//             text += possible.charAt(Math.floor(Math.random() * possible.length));

//         return text;
//     }

//     setInterval(() => {

//         count = count + 5
//         const request = {
//             blockNumber: count,
//             transactionHash: '0x24e9b910d7079fe588cafca1c905aa6a8ff473dcfcdc4267650d8a3edf0b3744',
//             from: term(from, stringGen(1)),
//             to: term(to, stringGen(1)),
//             value: '32134584048040000000000',
//             contractAddress: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
//             status: 'pending',
//             timeStamp: new Date()
//         }
//         db.collection("tokens").insert(request, (err, res) => {
//             socket.emit('newToken', request);
//         })
//     }, 40000);
// })

// })



// console.log('Listening ERC20 transfer...')

// var web3 = new Web3('wss://mainnet.infura.io/ws');

// var subscription = web3.eth.subscribe('logs', {
// address: '0x1deC5D3b1087972E7E3CF4a49d21aF08B157552D'
// }, function(error, result){
// if (!error)
// console.log(result);
// })
// .on("data", function(log){
// console.log(log);
// })
// .on("changed", function(log){
// });

const md5 = require('js-md5');
const uuid = require('uuid');
const config = require('../config/config')
const bls = require('../bls/bls')

const Transactions = {
  makeTransactions(req, res, node, ethIdentitiy, EthCrypto) {

    // let salt = "$2b$10$GChpib2m1DqqKpFr0n7J6u";
    // let hashKeyForA = bcrypt.hashSync(`${_walletA}_default`, salt).substring(20);
    // let hashKeyForB = bcrypt.hashSync(`${_walletB}_default`, salt).substring(20);

    let _walletA = req.body.from,
      _walletA_Bal = req.body.balance,
      _walletB = req.body.to,
      transactionObj = {},
      singleTransactionObject = {},
      singleWallet = {},
      valueFromADefault,
      valueFromBDefault,
      valueFromASet,
      valueFromBSet,
      walletListFromNode,
      innerTransaction,
      receiverTransaction,
      storeInNewSetA = false,
      storeInNewSetB = false,
      aExistBNotExist = false,
      aNotExistBExist = false,
      firstTransaction = false;

    const transactionUniqueId = uuid(),
      transaction = "transactions",
      wallet = "wallets",
      dhtKeyForADefault = md5(`${_walletA}_default`).concat('00000000'),
      dhtKeyForBDefault = md5(`${_walletB}_default`).concat('00000000'),
      time = new Date().getTime();


    node.iterativeFindValue(ethIdentitiy.address.substring(2), function (
      error,
      _res
    ) {
      walletListFromNode = _res.value;


      node.send("SEND_TRANSACTION_TO_LEADER",
        {
          from: req.body.from,
          balance: req.body.balance,
          to: req.body.to
        },
        [config.primaryNodeAddress, config.contact], (err, response) => {

          // console.log('sendToLeader', response.sign)
          // const sig = new bls.Signature()
          // sig.deserializeHexStr(response.sign)
          // console.log(sig, "Leader")
        })





      //   node.iterativeFindValue(
      //     Buffer.from(dhtKeyForADefault, "hex"),
      //     function(_err, _data) {
      //       //
      //       if (_err) {
      //       }
      //       valueFromADefault = _data.value;

      //      let resolveFromPromise =  function () { 
      //         return new Promise((resolve, reject) => {
      //       if(valueFromADefault){
      //         node.iterativeFindValue(
      //           Buffer.from(md5(`${_walletA}_tx_set_${valueFromADefault.transaction_set}`).concat('00000000'), "hex"),
      //       function(_err, responseFromASet) {
      //         //
      //         if (_err) {
      //         };

      //         // console.log(valueFromADefault.transaction_counts % valueFromADefault.set_size, 'modulo', valueFromADefault.transaction_counts, 'counts', valueFromADefault.set_size, 'size')

      //         if(!(valueFromADefault.transaction_counts % valueFromADefault.set_size)){
      //           storeInNewSetA = true;
      //         }

      //         console.log(responseFromASet, "responseFromASet")

      //         valueFromASet = responseFromASet.value;



      //         console.log(valueFromADefault, 'retrieve from A_default');
      //         console.log(valueFromASet, 'retrieve from set A');
      //         innerTransaction = valueFromADefault;

      //         node.iterativeFindValue(
      //                 Buffer.from(dhtKeyForBDefault, "hex"),
      //             function(_err, responseFromADefault) {
      //               //
      //               if (_err) {
      //               }

      //               valueFromBDefault = responseFromADefault.value;

      //               if(valueFromBDefault){

      //                 if(!(valueFromBDefault.transaction_counts % valueFromBDefault.set_size)){
      //                   storeInNewSetB = true;
      //                 }

      //                 node.iterativeFindValue(
      //                   Buffer.from(md5(`${_walletB}_tx_set_${valueFromBDefault.transaction_set}`).concat('00000000'), "hex"),
      //               function(_err, responseFromBSet) {
      //                 //
      //                 if (_err) {
      //                 };

      //                 valueFromBSet = responseFromBSet.value;
      //                 console.log(valueFromBDefault, 'retrieve from B_default');
      //                 console.log(valueFromBSet, 'retrieve from set B');
      //                 receiverTransaction = valueFromBDefault;
      //                 resolve();
      //               });
      //               }else{
      //                 let receiverTransactionForBalance = walletListFromNode.find(value => {
      //                   return value.identity == _walletB;
      //                 });

      //                 receiverTransaction = {
      //                   balance: receiverTransactionForBalance.balance,
      //                   transaction_counts: 0,
      //                   transaction_set: 1,
      //                   set_size: 5,
      //                 };

      //                 valueFromBSet = {
      //                   in: [],
      //                   out: []
      //                 };
      //               resolve();
      //               };
      //             }); 
      //       });
      //       }
      //       else{



      //       node.iterativeFindValue(
      //         Buffer.from(dhtKeyForBDefault, "hex"),
      //           function(_err, responseFromADefault) {
      //           //
      //           if (_err) {
      //           }

      //           valueFromBDefault = responseFromADefault.value;


      //           if(valueFromBDefault){

      //             node.iterativeFindValue(
      //               Buffer.from(md5(`${_walletB}_tx_set_${valueFromBDefault.transaction_set}`).concat('00000000'), "hex"),
      //           function(_err, responseFromBSet) {
      //             //
      //             if (_err) {
      //             };

      //             valueFromBSet = responseFromBSet.value;
      //             if(!(valueFromBDefault.transaction_counts % valueFromBDefault.set_size)){
      //               storeInNewSetB = true;
      //             };
      //             console.log(valueFromBDefault, 'retrieve from B_default');
      //             console.log(valueFromBSet, 'retrieve from set B');
      //             receiverTransaction = valueFromBDefault;

      //               let innerTransactionForBalance = walletListFromNode.find(value => {
      //             return value.identity == _walletA;
      //           });

      //           innerTransaction = {
      //             balance: innerTransactionForBalance.balance,
      //             transaction_counts: 0,
      //             transaction_set: 1,
      //             set_size: 5,
      //           };

      //           valueFromASet = {
      //             in: [],
      //             out: []
      //           };

      //             aNotExistBExist = true;
      //             resolve();
      //           });
      //           }else{
      //             firstTransaction = true;
      //             resolve();
      //           }
      //         }); 
      //       // resolve();
      //     }
      //   });
      // }

      // resolveFromPromise().then(() => {
      //   // else{
      //     //   _innerTransaction = _genesisValue[wallet].find(
      //     //         val => val.walletId === _walletA
      //     //       );
      //     //   _receiverTransaction = _genesisValue[wallet].find((val) => {
      //     //     return val.walletId === _walletB;
      //     //   })
      //     //     console.log(_innerTransaction, 'inner transaction in first ')
      //     // }

      //       // FOR FIRST TRANSACTION
      //       if (firstTransaction) {

      //         console.log('here')
      //         // node.iterativeFindValue(ethIdentitiy.address.substring(2), function(
      //         //   _err,
      //         //   _data
      //         // ) {

      //         if (walletListFromNode && walletListFromNode.length > 0) {
      //           //
      //           //
      //           let _walletAvailability = walletListFromNode.find(value => {
      //             return value.identity == _walletA;
      //           });
      //           let _walletAvailabilityB = walletListFromNode.find(value => {
      //             return value.identity == _walletB;
      //           });

      //           try {
      //             const signer = EthCrypto.recover(
      //               req.body.signature,
      //               EthCrypto.hash.keccak256(req.body.balance) // signed message hash
      //             );

      //             console.log(signer)
      //             if (parseInt(_walletAvailability.balance) < _walletA_Bal) {
      //               singleTransactionObject = {};
      //               singleTransactionObject.value = _walletA_Bal;
      //               singleTransactionObject.to = _walletB;
      //               singleTransactionObject.from = _walletA;
      //               singleTransactionObject.transactionId = transactionUniqueId;
      //               singleTransactionObject.timestamp =time;
      //               singleTransactionObject.status = "fail"

      //               console.log("going to store");

      //               console.log(md5(`${transactionUniqueId}_tx`).concat('00000000'), 'tx')
      //                 // store tx object using transactionId hash                         
      //                       node.iterativeStore(
      //                     Buffer.from(
      //                       md5(`${transactionUniqueId}_tx`).concat('00000000'),
      //                       "hex"
      //                     ),
      //                     singleTransactionObject,
      //                     function(_err, response) {
      //                       if (_err) {
      //                         // res.json(err);
      //                       }

      //                       console.log(md5(`${_walletA}_default`).concat('00000000'), 'A_default')
      //                       // store using A address_default
      //                       node.iterativeStore(
      //                         Buffer.from(
      //                           md5(`${_walletA}_default`).concat('00000000'),
      //                           "hex"
      //                         ),
      //                         {
      //                             balance: parseInt(_walletAvailability.balance),
      //                             transaction_counts: 1,
      //                             transaction_set: 1,
      //                             set_size: 5,
      //                         },
      //                         function(_err, response) {
      //                           if (_err) {
      //                             // res.json(err);
      //                           }

      //                       console.log(md5(`${_walletB}_default`).concat('00000000'), 'B_default')

      //                       // store using B address_default
      //                           node.iterativeStore(
      //                             Buffer.from(
      //                               md5(`${_walletB}_default`).concat('00000000'),
      //                               "hex"
      //                             ),
      //                             {
      //                                 balance: parseInt(_walletAvailabilityB.balance),
      //                                 transaction_counts: 1,
      //                                 transaction_set: 1,
      //                                 set_size: 5,
      //                             },
      //                             function(_err, response) {
      //                               if (_err) {
      //                                 // res.json(err);
      //                               }


      //                       console.log(md5(`${_walletA}_tx_set_1`).concat('00000000'), 'A_set')

      //                       // store using set of A        
      //                       node.iterativeStore(
      //                         Buffer.from(
      //                           md5(`${_walletA}_tx_set_1`).concat('00000000'),
      //                           "hex"
      //                         ),
      //                         {
      //                           in: [],
      //                           out: [ transactionUniqueId ]
      //                         },
      //                         function(_err, response) {
      //                           if (_err) {
      //                             // res.json(err);
      //                           }

      //                       console.log(md5(`${_walletB}_tx_set_1`).concat('00000000'), 'B_set')

      //                           // store using set of B        
      //                       node.iterativeStore(
      //                         Buffer.from(
      //                           md5(`${_walletB}_tx_set_1`).concat('00000000'),
      //                           "hex"
      //                         ),
      //                         {
      //                           in: [ transactionUniqueId ],
      //                           out: []
      //                         },
      //                         function(_err, response) {
      //                           if (_err) {
      //                             // res.json(err);
      //                           }
      //                           if (res.status) {
      //                             res.status(400).send({
      //                               status: "error",
      //                               message:
      //                                 "requested client doesn't have enough balance",
      //                               data : singleTransactionObject,
      //                             });
      //                           } else {
      //                             res.emit("transactionResponse", {
      //                               status: "error",
      //                               message:
      //                                 "requested client doesn't have enough balance",
      //                             data: singleTransactionObject,
      //                             });
      //                           };
      //                         });
      //                         });   
      //                     });
      //                         // });

      //                     });
      //                   console.log("stored in DHT", _err);
      //                 }
      //               );
      //             } else {
      //               singleTransactionObject = {};
      //               singleTransactionObject.value = _walletA_Bal;
      //               singleTransactionObject.to = _walletB;
      //               singleTransactionObject.from = _walletA;
      //               singleTransactionObject.transactionId = transactionUniqueId;
      //               singleTransactionObject.status = "success";

      //               walletListFromNode.forEach((wallet) => {
      //                 if (wallet.identity == _walletA) {
      //                   wallet.balance -= _walletA_Bal
      //                   if (wallet.balance <= 0) wallet.balance = 0
      //                 }

      //                 if (wallet.identity == _walletB) {
      //                   wallet.balance += _walletA_Bal
      //                 }
      //               })

      //               // transactionObj[transaction].push(singleTransactionObject);

      //               // _walletAvailability.balance -= _walletA_Bal;
      //               // _walletAvailabilityB.balance += _walletA_Bal;

      //               // transactionObj[wallet] = [];
      //               // singleWallet = {};
      //               // singleWallet.walletId = _walletA;
      //               // singleWallet.in = [];
      //               // singleWallet.out = [transactionUniqueId];
      //               // singleWallet.balance = parseInt(_walletAvailability.balance);
      //               // transactionObj[wallet].push(singleWallet);

      //               // //
      //               // singleWallet = {};
      //               // singleWallet.walletId = _walletB;
      //               // singleWallet.in = [transactionUniqueId];
      //               // singleWallet.out = [];
      //               // singleWallet.balance = parseInt(_walletAvailabilityB.balance);
      //               // transactionObj[wallet].push(singleWallet);

      //               console.log("going to store");

      //               console.log(md5(`${transactionUniqueId}_tx`).concat('00000000'), 'tx')
      //               // store tx object using transactionId hash                         
      //                     node.iterativeStore(
      //                   Buffer.from(
      //                     md5(`${transactionUniqueId}_tx`).concat('00000000'),
      //                     "hex"
      //                   ),
      //                   singleTransactionObject,
      //                   function(_err, response) {
      //                     if (_err) {
      //                       // res.json(err);
      //                     }

      //                     console.log(md5(`${_walletA}_default`).concat('00000000'), 'A_default')
      //                     // store using A address_default
      //                     node.iterativeStore(
      //                       Buffer.from(
      //                         md5(`${_walletA}_default`).concat('00000000'),
      //                         "hex"
      //                       ),
      //                       {
      //                           balance: parseInt(_walletAvailability.balance),
      //                           transaction_counts: 1,
      //                           transaction_set: 1,
      //                           set_size: 5,
      //                       },
      //                       function(_err, response) {
      //                         if (_err) {
      //                           // res.json(err);
      //                         }

      //                     console.log(md5(`${_walletB}_default`).concat('00000000'), 'B_default')

      //                     // store using B address_default
      //                         node.iterativeStore(
      //                           Buffer.from(
      //                             md5(`${_walletB}_default`).concat('00000000'),
      //                             "hex"
      //                           ),
      //                           {
      //                               balance: parseInt(_walletAvailabilityB.balance),
      //                               transaction_counts: 1,
      //                               transaction_set: 1,
      //                               set_size: 5,
      //                           },
      //                           function(_err, response) {
      //                             if (_err) {
      //                               // res.json(err);
      //                             }


      //                     console.log(md5(`${_walletA}_tx_set_1`).concat('00000000'), 'A_set')

      //                     // store using set of A        
      //                     node.iterativeStore(
      //                       Buffer.from(
      //                         md5(`${_walletA}_tx_set_1`).concat('00000000'),
      //                         "hex"
      //                       ),
      //                       {
      //                         in: [],
      //                         out: [ transactionUniqueId ]
      //                       },
      //                       function(_err, response) {
      //                         if (_err) {
      //                           // res.json(err);
      //                         }

      //                     console.log(md5(`${_walletB}_tx_set_1`).concat('00000000'), 'B_set')

      //                         // store using set of B        
      //                     node.iterativeStore(
      //                       Buffer.from(
      //                         md5(`${_walletB}_tx_set_1`).concat('00000000'),
      //                         "hex"
      //                       ),
      //                       {
      //                         in: [ transactionUniqueId ],
      //                         out: []
      //                       },
      //                       function(_err, response) {
      //                         if (_err) {
      //                           // res.json(err);
      //                         }
      //                         node.iterativeStore(
      //                           ethIdentitiy.address.substring(2),
      //                           walletListFromNode,
      //                           function(_err, _data) {
      //                             if (_err) {
      //                               console.log("wallet data not stored from initialize");
      //                             }
      //                             console.log("wallet data stored from initialize");
      //                           }
      //                         );


      //                   if (res.status) {
      //                     res.status(200).send({
      //                       status: "success",
      //                       message: "Transaction succeed",
      //                       data : singleTransactionObject,
      //                     });
      //                   } else {
      //                     res.emit("transactionResponse", {
      //                       status: "success",
      //                       message: "Transaction succeed",
      //                       data : singleTransactionObject,
      //                     });
      //                   };
      //                 });
      //               });
      //         });
      //      });
      //                 }
      //               );
      //             }
      //           } catch (err) {

      //             console.log(err, 'error')
      //             singleTransactionObject = {};
      //             singleTransactionObject.value = _walletA_Bal;
      //             singleTransactionObject.to = _walletB;
      //             singleTransactionObject.from = _walletA;
      //             singleTransactionObject.transactionId = transactionUniqueId;
      //             singleTransactionObject.status = "signature mismatch";

      //             // transactionObj[transaction].push(singleTransactionObject);
      //             // transactionObj[wallet] = [];
      //             // singleWallet = {};
      //             // singleWallet.walletId = _walletA;
      //             // singleWallet.in = [];
      //             // singleWallet.out = [transactionUniqueId];
      //             // singleWallet.balance = parseInt(_walletAvailability.balance);
      //             // transactionObj[wallet].push(singleWallet);

      //             // //
      //             // singleWallet = {};
      //             // singleWallet.walletId = _walletB;
      //             // singleWallet.in = [transactionUniqueId];
      //             // singleWallet.out = [];
      //             // singleWallet.balance = parseInt(_walletAvailabilityB.balance);
      //             // transactionObj[wallet].push(singleWallet);
      //             console.log("going to store");
      //             console.log(md5(`${transactionUniqueId}_tx`).concat('00000000'), 'tx')
      //             // store tx object using transactionId hash                         
      //                   node.iterativeStore(
      //                 Buffer.from(
      //                   md5(`${transactionUniqueId}_tx`).concat('00000000'),
      //                   "hex"
      //                 ),
      //                 singleTransactionObject,
      //                 function(_err, response) {
      //                   if (_err) {
      //                     // res.json(err);
      //                   }

      //                   console.log(md5(`${_walletA}_default`).concat('00000000'), 'A_default')
      //                   // store using A address_default
      //                   node.iterativeStore(
      //                     Buffer.from(
      //                       md5(`${_walletA}_default`).concat('00000000'),
      //                       "hex"
      //                     ),
      //                     {
      //                         balance: parseInt(_walletAvailability.balance),
      //                         transaction_counts: 1,
      //                         transaction_set: 1,
      //                         set_size: 5,
      //                     },
      //                     function(_err, response) {
      //                       if (_err) {
      //                         // res.json(err);
      //                       }

      //                   console.log(md5(`${_walletB}_default`).concat('00000000'), 'B_default')

      //                   // store using B address_default
      //                       node.iterativeStore(
      //                         Buffer.from(
      //                           md5(`${_walletB}_default`).concat('00000000'),
      //                           "hex"
      //                         ),
      //                         {
      //                             balance: parseInt(_walletAvailabilityB.balance),
      //                             transaction_counts: 1,
      //                             transaction_set: 1,
      //                             set_size: 5,
      //                         },
      //                         function(_err, response) {
      //                           if (_err) {
      //                             // res.json(err);
      //                           }


      //                   console.log(md5(`${_walletA}_tx_set_1`).concat('00000000'), 'A_set')

      //                   // store using set of A        
      //                   node.iterativeStore(
      //                     Buffer.from(
      //                       md5(`${_walletA}_tx_set_1`).concat('00000000'),
      //                       "hex"
      //                     ),
      //                     {
      //                       in: [],
      //                       out: [ transactionUniqueId ]
      //                     },
      //                     function(_err, response) {
      //                       if (_err) {
      //                         // res.json(err);
      //                       }

      //                   console.log(md5(`${_walletB}_tx_set_1`).concat('00000000'), 'B_set')

      //                       // store using set of B        
      //                   node.iterativeStore(
      //                     Buffer.from(
      //                       md5(`${_walletB}_tx_set_1`).concat('00000000'),
      //                       "hex"
      //                     ),
      //                     {
      //                       in: [ transactionUniqueId ],
      //                       out: []
      //                     },
      //                     function(_err, response) {
      //                       if (_err) {
      //                         // res.json(err);
      //                       }

      //                 if (res.status) {
      //                   res.status(400).send({
      //                     status: "error",
      //                     message: "Signature mismatch",
      //                     data : singleTransactionObject,
      //                   });
      //                 } else {
      //                   res.emit("transactionResponse", {
      //                     status: "error",
      //                     message: "Signature mismatch",
      //                     data : singleTransactionObject,                    
      //                   });
      //                 }
      //               });
      //               });
      //             });
      //       });

      //               }
      //             );
      //           }
      //         } else {
      //           console.log("wallet data not found for first case");
      //           if (res.status) {
      //             res.status(400).send({
      //               status: "error",
      //               message: "something went wrong"
      //             });
      //           } else {
      //             res.emit("transactionResponse", {
      //               status: "error",
      //               message: "something went wrong"
      //             });
      //           }
      //         }
      //         // });
      //       } else {
      //         // second transaction
      //         // @param _genesisValue

      //         console.log("here in second transaction");

      //         // if (_genesisValue && _genesisValue[wallet]) {
      //           // let _innerTransaction = _genesisValue[wallet].find(
      //           //   val => val.walletId === _walletA
      //           // );
      //           // let _receiverTransaction = _genesisValue[wallet].find(
      //           //   val => val.walletId === _walletB
      //           // );
      //           let _walletAvailabilityForThird, _walletAvailabilityForFirst;

      //           // both client is exist in transaction history
      //           if (innerTransaction && receiverTransaction) {

      //             // Balance verification
      //             if (
      //               parseInt(innerTransaction.balance) < parseInt(_walletA_Bal)
      //             ) {
      //               // transaction object

      //               // _innerTransaction.walletId = _walletA;
      //               // _innerTransaction.in = [..._innerTransaction.in];
      //               // _innerTransaction.out = [
      //               //   ..._innerTransaction.out,
      //               //   transactionUniqueId
      //               // ];
      //               // _innerTransaction.balance = _innerTransaction.balance;

      //               // //
      //               // _receiverTransaction.walletId = _walletB;
      //               // _receiverTransaction.in = [
      //               //   ..._receiverTransaction.in,
      //               //   transactionUniqueId
      //               // ];
      //               // _receiverTransaction.out = [..._receiverTransaction.out];
      //               // _receiverTransaction.balance = _receiverTransaction.balance;

      //               try {
      //                 const signer2 = EthCrypto.recover(
      //                   req.body.signature,
      //                   EthCrypto.hash.keccak256(req.body.balance) // signed message hash
      //                 );

      //                 let newTransactionObject = {};
      //                 newTransactionObject.transactionId = transactionUniqueId;
      //                 newTransactionObject.value = _walletA_Bal;
      //                 newTransactionObject.to = _walletB;
      //                 newTransactionObject.from = _walletA;
      //                 newTransactionObject.status = "fail";

      //                 // _genesisValue[transaction] = [
      //                 //   ..._genesisValue[transaction],
      //                 //   newTransactionObject
      //                 // ];

      //                 // _genesisValueOfB[transaction] = [
      //                 //   ..._genesisValueOfB[transaction],
      //                 //   newTransactionObject
      //                 // ];
      //                 console.log("going to store");

      //                 // store tx object using transactionId hash                         
      //                 node.iterativeStore(
      //                   Buffer.from(
      //                     md5(`${transactionUniqueId}_tx`).concat('00000000'),
      //                     "hex"
      //                   ),
      //                   newTransactionObject,
      //                   function(_err, response) {
      //                     if (_err) {
      //                       // res.json(err);
      //                     }

      //                     console.log(md5(`${_walletA}_default`).concat('00000000'), 'A_default  ----------------------------A')
      //                     // store using A address_default
      //                     node.iterativeStore(
      //                       Buffer.from(
      //                         md5(`${_walletA}_default`).concat('00000000'),
      //                         "hex"
      //                       ),
      //                       {
      //                           balance: innerTransaction.balance,
      //                           transaction_counts: innerTransaction.transaction_counts + 1,
      //                           transaction_set: storeInNewSetA ? innerTransaction.transaction_set + 1 : innerTransaction.transaction_set,
      //                           set_size: innerTransaction.set_size,
      //                       },
      //                       function(_err, response) {
      //                         if (_err) {
      //                           // res.json(err);
      //                         }

      //                         console.log(
      //                           {
      //                             balance: innerTransaction.balance,
      //                             transaction_counts: innerTransaction.transaction_counts + 1,
      //                             transaction_set: storeInNewSetA ? innerTransaction.transaction_set + 1 : innerTransaction.transaction_set,
      //                             set_size: innerTransaction.set_size,
      //                         },innerTransaction
      //                         )

      //                     console.log(md5(`${_walletB}_default`).concat('00000000'), 'B_default   ----------------------------B')

      //                     // store using B address_default
      //                         node.iterativeStore(
      //                           Buffer.from(
      //                             md5(`${_walletB}_default`).concat('00000000'),
      //                             "hex"
      //                           ),
      //                           {
      //                             balance: receiverTransaction.balance,
      //                             transaction_counts: receiverTransaction.transaction_counts + 1,
      //                             transaction_set: storeInNewSetB ? receiverTransaction.transaction_set + 1 : receiverTransaction.transaction_set,
      //                             set_size: receiverTransaction.set_size,
      //                         },
      //                           function(_err, response) {
      //                             if (_err) {
      //                               // res.json(err);
      //                             }


      //                     console.log(md5(`${_walletA}_tx_set_${innerTransaction.transaction_set}`).concat('00000000'), 'A_set')

      //                     // store using set of A        
      //                     node.iterativeStore(
      //                       Buffer.from(
      //                         md5(`${_walletA}_tx_set_${storeInNewSetA ? innerTransaction.transaction_set + 1 : innerTransaction.transaction_set}`).concat('00000000'),
      //                         "hex"
      //                       ),
      //                       storeInNewSetA ? 
      //                       {
      //                         in: [],
      //                         out: [ transactionUniqueId ]
      //                       } : 
      //                       {
      //                         in: [],
      //                         out: [ ...valueFromASet.out, transactionUniqueId ]
      //                       },
      //                       function(_err, response) {
      //                         if (_err) {
      //                           // res.json(err);
      //                         }

      //                     console.log(md5(`${_walletB}_tx_set_${receiverTransaction.transaction_set}`).concat('00000000'), 'B_set')

      //                         // store using set of B        
      //                     node.iterativeStore(
      //                       Buffer.from(
      //                         md5(`${_walletB}_tx_set_${storeInNewSetB ? receiverTransaction.transaction_set + 1 : receiverTransaction.transaction_set}`).concat('00000000'),                            
      //                         "hex"
      //                       ),
      //                       storeInNewSetB ? 
      //                       {
      //                         in: [ transactionUniqueId ],
      //                         out: []
      //                       } : 
      //                       {
      //                         in: [...valueFromBSet.in, transactionUniqueId],
      //                         out: []
      //                       },
      //                       function(_err, response) {
      //                         if (_err) {
      //                           // res.json(err);
      //                         }
      //                     if (res.status) {
      //                       res.status(400).send({
      //                         status: "error",
      //                         message:
      //                           "requested client doesn't have enough balance",
      //                         data: newTransactionObject,
      //                       });
      //                     } else {
      //                       res.emit("transactionResponse", {
      //                         status: "error",
      //                         message:
      //                           "requested client doesn't have enough balance",
      //                         data: newTransactionObject,
      //                       });
      //                     };
      //                   });
      //                 });
      //               });
      //                   });
      //                   }
      //                 );
      //               } catch (err) {
      //                 let newTransactionObject = {};
      //                 newTransactionObject.transactionId = transactionUniqueId;
      //                 newTransactionObject.value = _walletA_Bal;
      //                 newTransactionObject.to = _walletB;
      //                 newTransactionObject.from = _walletA;
      //                 newTransactionObject.status = "signature mismatch";

      //                 console.log("going to store");
      //                     // store tx object using transactionId hash                         
      //                     node.iterativeStore(
      //                       Buffer.from(
      //                         md5(`${transactionUniqueId}_tx`).concat('00000000'),
      //                         "hex"
      //                       ),
      //                       newTransactionObject,
      //                       function(_err, response) {
      //                         if (_err) {
      //                           // res.json(err);
      //                         }

      //                         console.log(md5(`${_walletA}_default`).concat('00000000'), 'A_default')
      //                         // store using A address_default
      //                         node.iterativeStore(
      //                           Buffer.from(
      //                             md5(`${_walletA}_default`).concat('00000000'),
      //                             "hex"
      //                           ),
      //                           {
      //                               balance: innerTransaction.balance,
      //                               transaction_counts: innerTransaction.transaction_counts + 1,
      //                               transaction_set: storeInNewSetA ? innerTransaction.transaction_set + 1 : innerTransaction.transaction_set,
      //                               set_size: innerTransaction.set_size,
      //                           },
      //                           function(_err, response) {
      //                             if (_err) {
      //                               // res.json(err);
      //                             }

      //                         console.log(md5(`${_walletB}_default`).concat('00000000'), 'B_default')

      //                         // store using B address_default
      //                             node.iterativeStore(
      //                               Buffer.from(
      //                                 md5(`${_walletB}_default`).concat('00000000'),
      //                                 "hex"
      //                               ),
      //                               {
      //                                 balance: receiverTransaction.balance,
      //                                 transaction_counts: receiverTransaction.transaction_counts + 1,
      //                                 transaction_set: storeInNewSetB ? receiverTransaction.transaction_set + 1 : receiverTransaction.transaction_set,
      //                                 set_size: receiverTransaction.set_size,
      //                             },
      //                               function(_err, response) {
      //                                 if (_err) {
      //                                   // res.json(err);
      //                                 }


      //                         console.log(md5(`${_walletA}_tx_set_${innerTransaction.transaction_set}`).concat('00000000'), 'A_set')

      //                         // store using set of A        
      //                         node.iterativeStore(
      //                           Buffer.from(
      //                             md5(`${_walletA}_tx_set_${storeInNewSetA ? innerTransaction.transaction_set + 1 : innerTransaction.transaction_set}`).concat('00000000'),
      //                             "hex"
      //                           ),
      //                           storeInNewSetA ? 
      //                           {
      //                             in: [],
      //                             out: [ transactionUniqueId ]
      //                           } : 
      //                           {
      //                             in: [],
      //                             out: [ ...valueFromASet.out, transactionUniqueId ]
      //                           },
      //                           function(_err, response) {
      //                             if (_err) {
      //                               // res.json(err);
      //                             }

      //                         console.log(md5(`${_walletB}_tx_set_${receiverTransaction.transaction_set}`).concat('00000000'), 'B_set')

      //                             // store using set of B        
      //                         node.iterativeStore(
      //                           Buffer.from(
      //                             md5(`${_walletB}_tx_set_${storeInNewSetB ? receiverTransaction.transaction_set + 1 : receiverTransaction.transaction_set}`).concat('00000000'),                            
      //                             "hex"
      //                           ),
      //                           storeInNewSetB ? 
      //                           {
      //                             in: [ transactionUniqueId ],
      //                             out: []
      //                           } : 
      //                           {
      //                             in: [...valueFromBSet.in, transactionUniqueId],
      //                             out: []
      //                           },
      //                           function(_err, response) {
      //                             if (_err) {
      //                               // res.json(err);
      //                             }

      //                     if (res.status) {
      //                       res.status(400).send({
      //                         status: "error",
      //                         message: "Signature mismatch",
      //                         data: newTransactionObject,
      //                       });
      //                     } else {
      //                       res.emit("transactionResponse", {
      //                         status: "error",
      //                         message: "Signature mismatch",
      //                         data: newTransactionObject,
      //                       });
      //                     };
      //                   });
      //                 });
      //               });
      //                   });
      //                   }
      //                 );
      //               }
      //             } else {



      //               try {
      //                 const signer2 = EthCrypto.recover(
      //                   req.body.signature,
      //                   EthCrypto.hash.keccak256(req.body.balance) // signed message hash
      //                 );


      //                 // transaction object
      //                 let newTransactionObject = {};
      //                 newTransactionObject.transactionId = transactionUniqueId;
      //                 newTransactionObject.value = _walletA_Bal;
      //                 newTransactionObject.to = _walletB;
      //                 newTransactionObject.from = _walletA;
      //                 newTransactionObject.status = "success";

      //                 walletListFromNode.forEach((wallet) => {
      //                   if (wallet.identity == _walletA) {
      //                     wallet.balance -= _walletA_Bal
      //                   if (wallet.balance <= 0) wallet.balance = 0
      //                   }

      //                   if (wallet.identity == _walletB) {
      //                     wallet.balance += _walletA_Bal
      //                   }
      //                 })

      //                 innerTransaction.balance -= _walletA_Bal;
      //                 receiverTransaction.balance += _walletA_Bal;

      //                 console.log("going to store");

      //                 // store tx object using transactionId hash                         
      //                 node.iterativeStore(
      //                   Buffer.from(
      //                     md5(`${transactionUniqueId}_tx`).concat('00000000'),
      //                     "hex"
      //                   ),
      //                   newTransactionObject,
      //                   function(_err, response) {
      //                     if (_err) {
      //                       // res.json(err);
      //                     }

      //                     console.log(md5(`${_walletA}_default`).concat('00000000'), 'A_default')
      //                     // store using A address_default
      //                     node.iterativeStore(
      //                       Buffer.from(
      //                         md5(`${_walletA}_default`).concat('00000000'),
      //                         "hex"
      //                       ),
      //                       {
      //                           balance: innerTransaction.balance,
      //                           transaction_counts: innerTransaction.transaction_counts + 1,
      //                           transaction_set: storeInNewSetA ? innerTransaction.transaction_set + 1 : innerTransaction.transaction_set,
      //                           set_size: innerTransaction.set_size,
      //                       },
      //                       function(_err, response) {
      //                         if (_err) {
      //                           // res.json(err);
      //                         }

      //                     console.log(md5(`${_walletB}_default`).concat('00000000'), 'B_default')

      //                     // store using B address_default
      //                         node.iterativeStore(
      //                           Buffer.from(
      //                             md5(`${_walletB}_default`).concat('00000000'),
      //                             "hex"
      //                           ),
      //                           {
      //                             balance: receiverTransaction.balance,
      //                             transaction_counts: receiverTransaction.transaction_counts + 1,
      //                             transaction_set: storeInNewSetB ? receiverTransaction.transaction_set + 1 : receiverTransaction.transaction_set,
      //                             set_size: receiverTransaction.set_size,
      //                         },
      //                           function(_err, response) {
      //                             if (_err) {
      //                               // res.json(err);
      //                             }


      //                     console.log(md5(`${_walletA}_tx_set_${innerTransaction.transaction_set}`).concat('00000000'), 'A_set')

      //                     // store using set of A        
      //                     node.iterativeStore(
      //                       Buffer.from(
      //                         md5(`${_walletA}_tx_set_${storeInNewSetA ? innerTransaction.transaction_set + 1 : innerTransaction.transaction_set}`).concat('00000000'),
      //                         "hex"
      //                       ),
      //                       storeInNewSetA ? 
      //                       {
      //                         in: [],
      //                         out: [ transactionUniqueId ]
      //                       } : 
      //                       {
      //                         in: [],
      //                         out: [ ...valueFromASet.out, transactionUniqueId ]
      //                       },
      //                       function(_err, response) {
      //                         if (_err) {
      //                           // res.json(err);
      //                         }

      //                     console.log(md5(`${_walletB}_tx_set_${receiverTransaction.transaction_set}`).concat('00000000'), 'B_set')

      //                         // store using set of B        
      //                     node.iterativeStore(
      //                       Buffer.from(
      //                         md5(`${_walletB}_tx_set_${storeInNewSetB ? receiverTransaction.transaction_set + 1 : receiverTransaction.transaction_set}`).concat('00000000'),                            
      //                         "hex"
      //                       ),
      //                       storeInNewSetB ? 
      //                       {
      //                         in: [ transactionUniqueId ],
      //                         out: []
      //                       } : 
      //                       {
      //                         in: [...valueFromBSet.in, transactionUniqueId],
      //                         out: []
      //                       },
      //                       function(_err, response) {
      //                         if (_err) {
      //                           // res.json(err);
      //                         }

      //                         node.iterativeStore(
      //                           ethIdentitiy.address.substring(2),
      //                           walletListFromNode,
      //                           function(_err, _data) {
      //                             if (_err) {
      //                               console.log("wallet data not stored from initialize");
      //                             }
      //                             console.log("wallet data stored from initialize");
      //                           }
      //                         );
      //                     if (res.status) {
      //                       res.status(200).send({
      //                         status: "success",
      //                         message: "Transaction succeed",
      //                         data: newTransactionObject,
      //                       });
      //                     } else {
      //                       res.emit("transactionResponse", {
      //                         status: "success",
      //                         message: "Transaction succeed",
      //                         data: newTransactionObject,
      //                       });
      //                     };
      //                   });
      //                 });
      //               });
      //                   });
      //                   }
      //                 );
      //               } catch (err) {
      //                 // transaction object
      //                 let newTransactionObject = {};
      //                 newTransactionObject.transactionId = transactionUniqueId;
      //                 newTransactionObject.value = _walletA_Bal;
      //                 newTransactionObject.to = _walletB;
      //                 newTransactionObject.from = _walletA;
      //                 newTransactionObject.status = "signature mismatch";
      //                       // store tx object using transactionId hash                         
      //                       node.iterativeStore(
      //                         Buffer.from(
      //                           md5(`${transactionUniqueId}_tx`).concat('00000000'),
      //                           "hex"
      //                         ),
      //                         newTransactionObject,
      //                         function(_err, response) {
      //                           if (_err) {
      //                             // res.json(err);
      //                           }

      //                           console.log(md5(`${_walletA}_default`).concat('00000000'), 'A_default')
      //                           // store using A address_default
      //                           node.iterativeStore(
      //                             Buffer.from(
      //                               md5(`${_walletA}_default`).concat('00000000'),
      //                               "hex"
      //                             ),
      //                             {
      //                                 balance: innerTransaction.balance,
      //                                 transaction_counts: innerTransaction.transaction_counts + 1,
      //                                 transaction_set: storeInNewSetA ? innerTransaction.transaction_set + 1 : innerTransaction.transaction_set,
      //                                 set_size: innerTransaction.set_size,
      //                             },
      //                             function(_err, response) {
      //                               if (_err) {
      //                                 // res.json(err);
      //                               }

      //                           console.log(md5(`${_walletB}_default`).concat('00000000'), 'B_default')

      //                           // store using B address_default
      //                               node.iterativeStore(
      //                                 Buffer.from(
      //                                   md5(`${_walletB}_default`).concat('00000000'),
      //                                   "hex"
      //                                 ),
      //                                 {
      //                                   balance: receiverTransaction.balance,
      //                                   transaction_counts: receiverTransaction.transaction_counts + 1,
      //                                   transaction_set: storeInNewSetB ? receiverTransaction.transaction_set + 1 : receiverTransaction.transaction_set,
      //                                   set_size: receiverTransaction.set_size,
      //                               },
      //                                 function(_err, response) {
      //                                   if (_err) {
      //                                     // res.json(err);
      //                                   }


      //                           console.log(md5(`${_walletA}_tx_set_${innerTransaction.transaction_set}`).concat('00000000'), 'A_set')

      //                           // store using set of A        
      //                           node.iterativeStore(
      //                             Buffer.from(
      //                               md5(`${_walletA}_tx_set_${storeInNewSetA ? innerTransaction.transaction_set + 1 : innerTransaction.transaction_set}`).concat('00000000'),
      //                               "hex"
      //                             ),
      //                             storeInNewSetA ? 
      //                             {
      //                               in: [],
      //                               out: [ transactionUniqueId ]
      //                             } : 
      //                             {
      //                               in: [],
      //                               out: [ ...valueFromASet.out, transactionUniqueId ]
      //                             },
      //                             function(_err, response) {
      //                               if (_err) {
      //                                 // res.json(err);
      //                               }

      //                           console.log(md5(`${_walletB}_tx_set_${receiverTransaction.transaction_set}`).concat('00000000'), 'B_set')

      //                               // store using set of B        
      //                           node.iterativeStore(
      //                             Buffer.from(
      //                               md5(`${_walletB}_tx_set_${storeInNewSetB ? receiverTransaction.transaction_set + 1 : receiverTransaction.transaction_set}`).concat('00000000'),                            
      //                               "hex"
      //                             ),
      //                             storeInNewSetB ? 
      //                             {
      //                               in: [ transactionUniqueId ],
      //                               out: []
      //                             } : 
      //                             {
      //                               in: [...valueFromBSet.in, transactionUniqueId],
      //                               out: []
      //                             },
      //                             function(_err, response) {
      //                               if (_err) {
      //                                 // res.json(err);
      //                               }

      //                     if (res.status) {
      //                       res.status(400).send({
      //                         status: "error",
      //                         message: "Signature mismatch",
      //                         data: newTransactionObject,
      //                       });
      //                     } else {
      //                       res.emit("transactionResponse", {
      //                         status: "error",
      //                         message: "Signature mismatch",
      //                         data: newTransactionObject,
      //                       });
      //                     };
      //                   });
      //                 });
      //               });
      //                   });
      //                   }
      //                 );
      //               }
      //             }
      //           }
      //       }

      //       //
      // });

      //     }
      //   );
    });
  },

  getTransactionHistory(req, res, node, ethIdentitiy) {

    console.log('in transaction list')
    // app.get("/node/data", (req, res) => {

    let transactionList = [];
    let listToSendInResponse = [];

    node.iterativeFindValue(ethIdentitiy.address.substring(2), function (
      _err,
      _data
    ) {

      console.log(ethIdentitiy, _data);

      if (_data && _data.value && _data.value.length > 0) {
        console.log('here')
        _data.value.forEach((client) => {
          transactionList.push(getTransactionsList(client.identity));
        });


        return Promise.all(transactionList).then((response) => {

          console.log(response, 'response')
          // response.forEach((resolveData) => {
          //   if(resolveData.length > 0){
          //     resolveData.forEach((client) => {
          //       listToSendInResponse.push(client);
          //     })
          //   }
          // })



          //  let transactionLogList = removeDuplicates(listToSendInResponse, 'transactionId');
          if (res.status) {
            res.status(200).send({
              status: "success",
              data: response
            });
          } else {
            console.log('for log list')
            res.emit("transactionList", {
              status: "success",
              data: response
            });
          };
          // });
          //     }else{
          //       if (res.status) {
          //         res.status(400).send({
          //           status: "something went wrong, no wallet list fount on node",
          //           // data: transactionLogList
          //         });
          //       } else {
          //         console.log('for log list')
          //         res.emit("transactionList", {
          //           status: "something went wrong, no wallet list fount on node",
          //           // data: transactionLogList
          //         });
          //     };
          //     }

        });

        function getTransactionsList(idOfClient) {
          return new Promise((resolve, reject) => {
            console.log(idOfClient, 'id')
            node.iterativeFindValue(Buffer.from(md5(`${idOfClient}_default`).concat('00000000'), "hex"), function (err, result) {
              if (result.value) {
                console.log(result.value);
              }
              resolve(result.value ? result.value : []);
            });
          })
        };

        function removeDuplicates(originalArray, prop) {
          var newArray = [];
          var lookupObject = {};

          for (var i in originalArray) {
            lookupObject[originalArray[i][prop]] = originalArray[i];
          }

          for (i in lookupObject) {
            newArray.push(lookupObject[i]);
          }
          return newArray;
        };

      };
    });
  }
}


module.exports = Transactions;

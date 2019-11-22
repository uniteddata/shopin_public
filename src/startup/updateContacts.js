
// public topic 'UPDATE_CONTACT_LIST'
module.exports = function updateContactList(latestContact, node) {

  node.quasar.quasarPublish("UPDATE_CONTACT_LIST", latestContact, () => {});
};

module.exports = function storeDataToAllNode(data, node) {

  node.quasar.quasarPublish("SEND_DATA_TO_NETWORK", data, (err, del) => { console.log(del.length)});
};

// module.exports = function sendPingWithData(data, node, callback) {

//   node.quasar.quasarPublish("REQUEST_TO_NODE", data, callback);
// };

// if (node.contact.isMaster == "true") {
//   node.router.allBuckets.forEach((singleItem) => {
//    node.sendDataToAllNodes([singleItem.identity, singleItem.contact], "data to store", (err, res) => {
//      console.log(err, res)
//    })
//   })
// }

// public topic 'UPDATE_CONTACT_LIST'
module.exports = function updateContactList(latestContact, node) {

  node.quasar.quasarPublish("UPDATE_CONTACT_LIST", latestContact, () => {});
};

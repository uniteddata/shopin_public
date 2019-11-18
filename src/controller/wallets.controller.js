const Wallets = {
    getWallets(res, node, ethIdentitiy) {
      node.iterativeFindValue(ethIdentitiy.address.substring(2), function(
        _err,
        _data
      ) {
        if(res.status){
          res.status(200).send({
            status: "success",
            data: _data.value
          })
        }
        else{
          res.emit('walletList', {
            status: "success",
            data: _data.value
          });
        }
      });
    }
  };
  
  module.exports = Wallets;
  
  
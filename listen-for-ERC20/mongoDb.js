var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://admin:myadminpassword@ec2-3-19-111-40.us-east-2.compute.amazonaws.com/admin';

module.exports = function connectionToMongo() {
    return new Promise((resolve, reject) => {
        return MongoClient.connect(url, function (err, client) {
            var db = client.db('shopinDhtTokens');
            resolve(db)
        });
    });
}

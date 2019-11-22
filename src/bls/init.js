const bls = require('./bls.js')

module.exports = function blsInit() {
    return new Promise((resolve, rejects) => {
        bls.init(bls.BN254)
            .then(() => {
                console.log(`name=${'BN254'} curve order=${bls.getCurveOrder()}`)
                resolve(true)
            })
    })
}
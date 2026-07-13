const { ethers } = require("hardhat");

async function mineEffort(sender, slot, dataHash, difficulty = 4) {
    let nonce = 0;
    const target = "0x" + "0".repeat(difficulty * 2);
    const start = Date.now();
    
    console.log(`Mining effort for slot ${slot}...`);
    
    while (true) {
        const hash = ethers.keccak256(
            ethers.solidityPacked(["uint256", "address", "uint256", "bytes32"], 
            [nonce, sender, slot, dataHash])
        );
        
        if (hash.startsWith(target)) {
            const elapsed = ((Date.now() - start) / 1000).toFixed(2);
            console.log(`Nonce: ${nonce} | Time: ${elapsed}s | Hash: ${hash}`);
            return nonce;
        }
        
        nonce++;
        if (nonce % 100000 === 0) {
            process.stdout.write(`\rTried: ${nonce}...`);
        }
    }
}

module.exports = { mineEffort };

if (require.main === module) {
    const [,, sender, slot, dataHash] = process.argv;
    mineEffort(sender, parseInt(slot), dataHash).then(n => {
        console.log("\nUse this nonce in commitData:", n);
        process.exit(0);
    });
}
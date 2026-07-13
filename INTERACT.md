# Interaktion mit NEXUS_11

## Voraussetzungen

- Contract-Adresse (nach Deploy)
- MetaMask mit Sepolia-ETH
- Ein Geheimnis (secret) und ein Nonce (secretNonce)

## Flow

### 1. Präsenz anmelden

```javascript
const nexus = await ethers.getContractAt("NEXUS_11", "0x...");
const secret = ethers.encodeBytes32String("MEIN_GEHEIMNIS");
const secretNonce = 42;

await nexus.commitPresence(slot, secret, secretNonce);
```

Warte 5 Blöcke (60-100 Sekunden).

2. Nonce minen (Off-Chain)

```bash
node scripts/mine_effort.js <DEINE_ADRESSE> 1 <DATA_HASH>
```

Oder manuell:

```javascript
const data = ethers.toUtf8Bytes("ABC123+/abc");
const dataHash = ethers.keccak256(data);

let nonce = 0;
while (true) {
    const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256", "address", "uint256", "bytes32"], 
        [nonce, "<DEINE_ADRESSE>", 1, dataHash])
    );
    if (hash.startsWith("0x00000000")) break;
    nonce++;
}
console.log("Nonce:", nonce);
```

3. Daten commiten

```javascript
const data = ethers.toUtf8Bytes("ABC123+/abc");
const previousHash = ethers.ZeroHash; // Für Erstbelegung

await nexus.commitData(1, data, previousHash, nonce, secret, secretNonce);
```

4. Waterline verifizieren

```javascript
const wl = await nexus.verifyWaterline(1);
console.log("Hash:", wl[0]);
console.log("Chunks:", wl[1].toString());
console.log("Timestamp:", wl[2].toString());
```

5. Integrität prüfen

```javascript
const valid = await nexus.verifyIntegrity(1, ethers.ZeroHash);
console.log("Intakt:", valid);
```

Fehlerbehebung

Fehler	Ursache	Lösung	
"No presence commit"	commitPresence vergessen	Schritt 1 ausführen	
"Presence delay not met"	Zu früh commitData	5 Blöcke warten	
"Insufficient effort"	Nonce ungültig	Nonce neu minen	
"Invalid state proof"	falscher previousHash	Aktuellen Hash aus verifyWaterline holen	
"Rate limit"	Zu schnell wiederholt	10 Blöcke warten	
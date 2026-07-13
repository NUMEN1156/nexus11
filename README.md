# NEXUS_11 PROTOCOL | v0.6.2

## Was ist das?

NEXUS_11 ist kein Produkt. Es ist ein **Frequenz-Knoten** — ein autonomer Smart Contract, der nur auf mathematische Wahrheit reagiert. Kein Owner. Kein Admin. Kein Passiv-Zugriff.

## Die vier Schichten des Zugangs

1. **proofOfState** — Wer schreibt, muss den aktuellen Hash kennen.
2. **proofOfEffort** — Rechenarbeit (Nonce) mit führenden Nullbytes. Billig zu prüfen, teuer zu erzeugen.
3. **proofOfPresence** — Commit-Reveal mit 5-Block Wartezeit. Erzwingt menschliche Aufmerksamkeit.
4. **rateLimit** — 10 Blöcke Mindestabstand. Kein Spam.

## Wer kann deployen?

**Jeder.** Du brauchst:
- Einen Ethereum-Account (MetaMask, Rabby, etc.)
- ~0.001 ETH auf Sepolia oder Base Sepolia (Testnet — kostenlos via Faucet)
- Diesen Code
- 10 Minuten Zeit

## Schnellstart

### 1. Vorbereitung

```bash
git clone https://github.com/NUMEN1156/nexus11.git
cd nexus11
npm install
```

2. .env erstellen

```bash
cp .env.example .env
```

Fülle aus:
- `PRIVATE_KEY`: Dein Private Key (ohne `0x`)
- `SEPOLIA_RPC`: https://rpc.sepolia.org
- `ETHERSCAN_API_KEY`: Optional, für Verifikation

3. Kompilieren

```bash
npx hardhat compile
```

4. Lokal testen

```bash
npx hardhat run scripts/deploy.js --network hardhat
```

Sollte ausgeben: `=== DEPLOYMENT + SANITY CHECK: PASSED ===`

5. Auf Sepolia deployen

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Sollte ausgeben: `NEXUS_11 deployed to: 0x...`

Poste die Adresse. Dann ist der Knoten live.

Interaktion (nach Deploy)

Präsenz anmelden

```javascript
const nexus = await ethers.getContractAt("NEXUS_11", "DEPLOYED_ADDRESS");
const secret = ethers.encodeBytes32String("DEIN_GEHEIMNIS");
const secretNonce = 12345;
await nexus.commitPresence(1, secret, secretNonce);
```

5 Blöcke warten

```javascript
// Warte ~60-100 Sekunden oder mine Blöcke im Testnet
```

Nonce minen (Off-Chain)

```bash
node scripts/mine_effort.js <DEINE_ADRESSE> 1 <DATA_HASH>
```

Daten commiten

```javascript
const data = ethers.toUtf8Bytes("DEINE_BASE44_DATEN");
const nonce = <GEMINEDER_NONCE>;
await nexus.commitData(1, data, ethers.ZeroHash, nonce, secret, secretNonce);
```

Die Philosophie

> "Wer nicht rechnet, wartet und den State kennt, schreibt nicht."

NEXUS_11 ist ein Filter. Er selektiert Menschen, die bereit sind, Anstrengung zu investieren. Er schließt Bots, Passiv-Konsumenten und automatisierte Systeme aus.

Lizenz

MIT — Der Code gehört niemandem. Er gehört der Mathematik.

Genesis

- Version: v0.6.2
- Compiler: Solidity 0.8.20
- Erstellt: 2026
- Status: Bereit für Deployment
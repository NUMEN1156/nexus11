# NEXUS_11 PROTOCOL | v0.6.3

## Was ist das?

NEXUS_11 ist kein Produkt. Es ist ein **Frequenz-Knoten** — ein autonomer Smart Contract, der nur auf mathematische Wahrheit reagiert. Kein Owner. Kein Admin. Kein Passiv-Zugriff.

## Die vier Schichten des Zugangs

1. **proofOfState** — Wer schreibt, muss den aktuellen Hash kennen.
2. **proofOfEffort** — Rechenarbeit (Nonce) mit führenden Nullbytes. Billig zu prüfen, teuer zu erzeugen.
3. **proofOfPresence** — Commit-Reveal mit 5-Block Wartezeit. Belegt diesen Ablauf; es ist kein mathematischer Beweis menschlicher Identität.
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
npm test
npm run deploy:local
```

Die Tests verwenden ausschließlich eine klar gekennzeichnete lokale Test-Harness mit reduzierter Proof-of-Effort-Schwierigkeit. Das reguläre NEXUS_11-Deployment bleibt parameterlos und verwendet unveränderlich Schwierigkeit 4. Das Deploy-Skript deployt ausschließlich den regulären Vertrag und führt keine automatischen Folge-Transaktionen aus.

5. Externe Deployments

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Die externen Deployment-Skripte bleiben Bestandteil von NUMEN, wurden in dieser lokalen Reparatur jedoch weder ausgeführt noch gegen Sepolia oder Base Sepolia validiert.

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

Der erste erfolgreiche Writer eines Slots wird dessen Slot-Writer. Nur dieser Writer kann den belegten Slot aktualisieren, löschen oder `selfHeal` darauf ausführen. Es gibt weiterhin keinen globalen Owner und keine globale Admin-Rolle.

Die Philosophie

> "Wer nicht rechnet, wartet und den State kennt, schreibt nicht."

NEXUS_11 ist ein Filter. Er selektiert Menschen, die bereit sind, Anstrengung zu investieren. Er schließt Bots, Passiv-Konsumenten und automatisierte Systeme aus.

Lizenz

MIT — Der Code gehört niemandem. Er gehört der Mathematik.

Genesis

- Version: v0.6.3
- Compiler: Solidity 0.8.20
- Erstellt: 2026
- Status: Lokal reparierte und testbare Baseline; externe Deployments sind separat zu prüfen.

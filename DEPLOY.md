# Deployment-Anleitung

## Option A: Lokales Hardhat

### Schritt 1: Node.js installieren
https://nodejs.org/ (LTS Version)

### Schritt 2: Projekt klonen
```bash
git clone https://github.com/NUMEN1156/nexus11.git
cd nexus11
```

Schritt 3: Abhängigkeiten

```bash
npm install
```

Schritt 4: Wallet vorbereiten
1. MetaMask installieren
2. Sepolia-Netzwerk hinzufügen
3. Sepolia-ETH besorgen (Faucet: https://sepoliafaucet.com/)
4. Private Key kopieren (Account Details -> Export Private Key)

Schritt 5: .env erstellen

```bash
cp .env.example .env
```

In `.env` eintragen:

```
PRIVATE_KEY=dein_private_key_ohne_0x
SEPOLIA_RPC=https://rpc.sepolia.org
```

Schritt 6: Kompilieren

```bash
npx hardhat compile
```

Schritt 7: Lokale Tests und lokales Deployment

```bash
npm test
npm run deploy:local
```

Das reguläre NEXUS_11-Deployment bleibt parameterlos und verwendet unveränderlich `EFFORT_DIFFICULTY = 4`. Die Tests verwenden ausschließlich eine klar gekennzeichnete lokale Test-Harness mit Schwierigkeit 1. Das reguläre Deploy-Skript referenziert diese Harness nicht und führt keine automatischen Presence- oder Daten-Transaktionen aus.

Schritt 8: Externe Deployments

```bash
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

Diese externen Pfade bleiben Bestandteil von NUMEN. Sie wurden in der lokalen Reparatur weder ausgeführt noch gegen ein Testnet oder Mainnet validiert. Der Vertrag verwendet auch dort fest Schwierigkeit 4.

Schritt 9: Verifizieren (optional)

```bash
npx hardhat verify --network sepolia <DEPLOYED_ADDRESS>
```

Option B: Remix (Schnelltest)

1. https://remix.ethereum.org
2. Neuer File: `NEXUS_11.sol`
3. Code einfügen
4. Compiler: 0.8.20
5. Deploy & Run: JavaScript VM
6. Deploy

Externe Deployments und Verifikation erfordern eine gesonderte operative Prüfung. Diese Baseline-Reparatur ist keine Produktionsfreigabe.

Option C: Foundry (Alternativ)

```bash
forge init nexus11-foundry
# Contract nach src/NEXUS_11.sol kopieren
forge build
forge test
forge create --rpc-url $SEPOLIA_RPC --private-key $PRIVATE_KEY src/NEXUS_11.sol:NEXUS_11
```

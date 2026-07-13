# Deployment-Anleitung

## Option A: Hardhat (Empfohlen)

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

Schritt 7: Test-Deploy (lokal)

```bash
npx hardhat run scripts/deploy.js --network hardhat
```

Sollte grün durchlaufen.

Schritt 8: Live-Deploy (Sepolia)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Warte auf Bestätigung. Kopiere die Adresse.

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

Für Live-Deploy: MetaMask auf Sepolia umstellen, dann "Injected Provider" wählen.

Option C: Foundry (Alternativ)

```bash
forge init nexus11-foundry
# Contract nach src/NEXUS_11.sol kopieren
forge build
forge test
forge create --rpc-url $SEPOLIA_RPC --private-key $PRIVATE_KEY src/NEXUS_11.sol:NEXUS_11
```
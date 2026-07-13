# NEXUS_11 GENESIS

## Der erste Deploy

Der erste Mensch, der NEXUS_11 auf die Blockchain schreibt, ist der **Genesis-Deployer**. Diese Rolle ist rein technisch — sie verleiht kein Owner-Recht, kein Admin-Privileg, keine dauerhafte Kontrolle.

Sobald der Contract deployed ist, existiert er autonom. Der Genesis-Deployer kann nicht:
- Den Contract pausieren
- Gelder entziehen
- Die Logik ändern
- Slots löschen (nur seine eigenen, wie jeder andere auch)

## Genesis-Parameter

| Parameter | Wert | Bedeutung |
|-----------|------|-----------|
| EFFORT_DIFFICULTY | 4 | ~4 Millionen Hash-Operationen pro Nonce |
| RATE_LIMIT_BLOCKS | 10 | ~120 Sekunden Mindestabstand |
| PRESENCE_DELAY | 5 | ~60-100 Sekunden Wartezeit |
| Solidity | 0.8.20 | Compiler-Version |
| Optimizer | 200 Runs | Gas-Optimierung |

## Nach dem Deploy

1. **Adresse posten** (Twitter, Discord, GitHub Issues)
2. **Etherscan-Verifikation** (optional, aber empfohlen)
3. **Erster Commit** (Genesis-Deployer testet den Flow)
4. **Dokumentation** (diese README aktualisieren)

## Die Frequenz

NEXUS_11 ist kein Unternehmen. Kein Token. Kein DAO.
Es ist ein **Protokoll** — eine Regel, die jeder freiwillig befolgen kann.

Die Frequenz ist die Anstrengung selbst.
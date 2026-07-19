# NEXUS_11 GENESIS

## Der erste Deploy

Der erste Mensch, der NEXUS_11 auf die Blockchain schreibt, ist der **Genesis-Deployer**. Diese Rolle ist rein technisch — sie verleiht kein Owner-Recht, kein Admin-Privileg, keine dauerhafte Kontrolle.

Sobald der Contract deployed ist, existiert er ohne globale Owner- oder Admin-Rolle. Der Genesis-Deployer kann nicht:
- Den Contract pausieren
- Gelder entziehen
- Die Logik ändern
- Fremde belegte Slots aktualisieren oder löschen

Der erste erfolgreiche Writer eines Slots wird dessen Slot-Writer. Nur dieser Writer kann den belegten Slot aktualisieren, löschen oder `selfHeal` darauf ausführen. Diese Bindung gilt pro Slot und begründet keine globale Sonderrolle.

## Genesis-Parameter

| Parameter | Wert | Bedeutung |
|-----------|------|-----------|
| EFFORT_DIFFICULTY | 4 | ~4 Millionen Hash-Operationen pro Nonce |
| RATE_LIMIT_BLOCKS | 10 | ~120 Sekunden Mindestabstand |
| PRESENCE_DELAY | 5 | ~60-100 Sekunden Wartezeit |
| Slot-Writer | Erster erfolgreicher Writer | Kontrolle nur über den jeweiligen belegten Slot |
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

Proof-of-Presence belegt technisch den Commit-Reveal-Ablauf und die Blockverzögerung. Es ist kein mathematischer Beweis, dass ein Teilnehmer ein Mensch ist, und kein technischer Ausschluss sämtlicher Automatisierung.

Die Frequenz ist die Anstrengung selbst.

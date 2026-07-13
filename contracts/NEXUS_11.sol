// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NEXUS_11 v0.6.2 | PROOF OF HUMAN PRESENCE
 * @notice Kein Owner. Kein Passiv-Zugriff. Nur Anstrengung + Wahrheit.
 * 
 * Zugangskontrolle (4 Schichten):
 * 1. proofOfState: Mathematische Kenntnis des vorherigen Hashes.
 * 2. proofOfEffort: Rechenarbeit (Nonce) — billig zu prüfen, teuer zu erzeugen.
 * 3. proofOfPresence: Commit-Reveal + Zeitverzögerung. Erzwingt menschliche Aufmerksamkeit.
 * 4. rateLimit: Mindestens 10 Blöcke zwischen zwei Commits pro Slot.
 */
contract NEXUS_11 {
    struct Waterline {
        bytes32 dataHash;
        uint256 chunkCount;
        uint256 timestamp;
        uint256 lastBlock;
        bool exists;
    }
    
    struct Presence {
        bytes32 commitHash;
        uint256 commitBlock;
        bool revealed;
    }
    
    mapping(uint256 => Waterline) public waterlines;
    mapping(uint256 => mapping(uint256 => bytes32)) public dataChunks;
    mapping(uint256 => mapping(address => Presence)) public presences;
    
    uint256 public constant EFFORT_DIFFICULTY = 4; 
    uint256 public constant RATE_LIMIT_BLOCKS = 10;
    uint256 public constant PRESENCE_DELAY = 5;
    
    event DataCommitted(uint256 indexed slot, bytes32 dataHash, uint256 chunkCount, uint256 timestamp, uint256 nonce);
    event ChunkCommitted(uint256 indexed slot, uint256 indexed chunkIndex, bytes32 data);
    event IntegrityVerified(uint256 indexed slot, bool valid);
    event SlotHealed(uint256 indexed slot, bytes32 corruptedHash);
    event SlotCleared(uint256 indexed slot);
    event EffortValidated(address indexed sender, uint256 nonce, bytes32 hash);
    event PresenceCommitted(uint256 indexed slot, address indexed sender, bytes32 commitHash);
    event PresenceRevealed(uint256 indexed slot, address indexed sender, uint256 blocksWaited);

    modifier proofOfState(uint256 _slot, bytes32 _previousHash) {
        Waterline storage wl = waterlines[_slot];
        if (wl.exists) {
            require(wl.dataHash == _previousHash, "Invalid state proof");
        } else {
            require(_previousHash == bytes32(0), "First commit needs 0x0");
        }
        _;
    }
    
    modifier proofOfEffort(uint256 _slot, bytes32 _dataHash, uint256 _nonce) {
        bytes32 effortHash = keccak256(abi.encodePacked(_nonce, msg.sender, _slot, _dataHash));
        require(_checkLeadingZeros(effortHash, EFFORT_DIFFICULTY), "Insufficient effort");
        emit EffortValidated(msg.sender, _nonce, effortHash);
        _;
    }
    
    modifier proofOfPresence(uint256 _slot, bytes32 _secret, uint256 _secretNonce) {
        Presence storage p = presences[_slot][msg.sender];
        require(p.commitHash != bytes32(0), "No presence commit");
        require(!p.revealed, "Already revealed");
        require(
            keccak256(abi.encodePacked(_secret, _secretNonce, msg.sender, _slot)) == p.commitHash,
            "Invalid secret"
        );
        require(block.number >= p.commitBlock + PRESENCE_DELAY, "Presence delay not met");
        uint256 waited = block.number - p.commitBlock;
        p.revealed = true;
        emit PresenceRevealed(_slot, msg.sender, waited);
        _;
    }
    
    modifier rateLimit(uint256 _slot) {
        if (waterlines[_slot].exists) {
            require(
                block.number >= waterlines[_slot].lastBlock + RATE_LIMIT_BLOCKS,
                "Rate limit: Wait more blocks"
            );
        }
        _;
    }

    function _checkLeadingZeros(bytes32 _hash, uint256 _zeros) internal pure returns (bool) {
        return uint256(_hash) >> (256 - _zeros * 8) == 0;
    }

    function isValidBase44(bytes calldata data) public pure returns (bool) {
        for (uint i = 0; i < data.length; i++) {
            bytes1 b = data[i];
            bool isAlphaNum = (b >= 0x41 && b <= 0x5A) || (b >= 0x61 && b <= 0x7A) || (b >= 0x30 && b <= 0x39);
            bool isSpecial = (b == 0x2B || b == 0x2F);
            if (!isAlphaNum && !isSpecial) return false;
        }
        return true;
    }

    function commitChunk(uint256 _slot, uint256 _chunkIndex, bytes32 _data) external {
        dataChunks[_slot][_chunkIndex] = _data;
        emit ChunkCommitted(_slot, _chunkIndex, _data);
    }

    function getChunk(uint256 _slot, uint256 _chunkIndex) external view returns (bytes32) {
        return dataChunks[_slot][_chunkIndex];
    }

    function commitData(
        uint256 _slot, 
        bytes calldata _data, 
        bytes32 _previousHash,
        uint256 _nonce,
        bytes32 _secret,
        uint256 _secretNonce
    ) 
        external 
        proofOfState(_slot, _previousHash)
        proofOfEffort(_slot, keccak256(_data), _nonce)
        proofOfPresence(_slot, _secret, _secretNonce)
        rateLimit(_slot)
    {
        require(isValidBase44(_data), "Invalid Base44 data");
        require(_data.length > 0, "Empty data");
        
        uint256 len = _data.length;
        uint256 chunkCount = (len + 31) / 32;
        
        for (uint256 i = 0; i < chunkCount; i++) {
            bytes32 chunk;
            uint256 offset = i * 32;
            uint256 remaining = len - offset;
            uint256 copyLen = remaining > 32 ? 32 : remaining;
            
            assembly {
                let dataPtr := add(_data.offset, offset)
                chunk := calldataload(dataPtr)
                if lt(copyLen, 32) {
                    let shiftBits := mul(sub(32, copyLen), 8)
                    chunk := shl(shiftBits, shr(shiftBits, chunk))
                }
            }
            dataChunks[_slot][i] = chunk;
        }
        
        bytes32 dataHash = keccak256(_data);
        waterlines[_slot] = Waterline({
            dataHash: dataHash,
            chunkCount: chunkCount,
            timestamp: block.timestamp,
            lastBlock: block.number,
            exists: true
        });
        
        emit DataCommitted(_slot, dataHash, chunkCount, block.timestamp, _nonce);
    }

    function verifyWaterline(uint256 _slot) external view returns (bytes32 dataHash, uint256 chunkCount, uint256 timestamp, uint256 lastBlock) {
        require(waterlines[_slot].exists, "Slot empty");
        Waterline memory wl = waterlines[_slot];
        return (wl.dataHash, wl.chunkCount, wl.timestamp, wl.lastBlock);
    }
    
    function reconstructData(uint256 _slot) external view returns (bytes memory) {
        require(waterlines[_slot].exists, "Slot empty");
        Waterline memory wl = waterlines[_slot];
        uint256 totalLen = wl.chunkCount * 32;
        bytes memory result = new bytes(totalLen);
        
        for (uint256 i = 0; i < wl.chunkCount; i++) {
            bytes32 chunk = dataChunks[_slot][i];
            uint256 offset = i * 32;
            assembly {
                mstore(add(add(result, 0x20), offset), chunk)
            }
        }
        return result;
    }
    
    function verifyIntegrity(uint256 _slot, bytes32 _expectedHash) public view returns (bool) {
        if (!waterlines[_slot].exists) return false;
        
        Waterline memory wl = waterlines[_slot];
        uint256 totalLen = wl.chunkCount * 32;
        bytes memory fullData = new bytes(totalLen);
        
        for (uint256 i = 0; i < wl.chunkCount; i++) {
            bytes32 chunk = dataChunks[_slot][i];
            uint256 offset = i * 32;
            assembly {
                mstore(add(add(fullData, 0x20), offset), chunk)
            }
        }
        
        bytes32 computedHash = keccak256(fullData);
        bytes32 targetHash = _expectedHash == bytes32(0) ? wl.dataHash : _expectedHash;
        return computedHash == targetHash;
    }
    
    function selfHeal(uint256 _slot) external returns (bool) {
        require(waterlines[_slot].exists, "Slot empty");
        
        Waterline memory wl = waterlines[_slot];
        uint256 totalLen = wl.chunkCount * 32;
        bytes memory fullData = new bytes(totalLen);
        
        for (uint256 i = 0; i < wl.chunkCount; i++) {
            bytes32 chunk = dataChunks[_slot][i];
            uint256 offset = i * 32;
            assembly {
                mstore(add(add(fullData, 0x20), offset), chunk)
            }
        }
        
        bool valid = keccak256(fullData) == wl.dataHash;
        if (!valid) {
            bytes32 corruptedHash = wl.dataHash;
            _clearSlotInternal(_slot, wl.chunkCount);
            emit SlotHealed(_slot, corruptedHash);
            return true;
        }
        return false;
    }
    
    function clearSlot(uint256 _slot) external {
        require(waterlines[_slot].exists, "Slot empty");
        _clearSlotInternal(_slot, waterlines[_slot].chunkCount);
        emit SlotCleared(_slot);
    }
    
    function _clearSlotInternal(uint256 _slot, uint256 _chunkCount) internal {
        for (uint256 i = 0; i < _chunkCount; i++) {
            delete dataChunks[_slot][i];
        }
        delete waterlines[_slot];
    }
    
    function checkEffort(uint256 _nonce, address _sender, uint256 _slot, bytes32 _dataHash) external pure returns (bool, bytes32) {
        bytes32 effortHash = keccak256(abi.encodePacked(_nonce, _sender, _slot, _dataHash));
        bool valid = _checkLeadingZeros(effortHash, EFFORT_DIFFICULTY);
        return (valid, effortHash);
    }
    
    function getPresence(uint256 _slot, address _sender) external view returns (bytes32 commitHash, uint256 commitBlock, bool revealed) {
        Presence memory p = presences[_slot][_sender];
        return (p.commitHash, p.commitBlock, p.revealed);
    }
}
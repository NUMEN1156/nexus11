// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../NEXUS_11.sol";

/**
 * @dev LOCAL TEST HARNESS ONLY.
 * Reduces proof-of-effort difficulty for deterministic local tests.
 * It is not referenced by NUMEN deployment scripts and is not a production module.
 */
contract NEXUS_11TestHarness is NEXUS_11 {
    function _effortDifficulty() internal pure override returns (uint256) {
        return 1;
    }
}

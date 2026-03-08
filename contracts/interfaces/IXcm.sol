// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

address constant XCM_PRECOMPILE_ADDRESS =
    address(0x00000000000000000000000000000000000a0000);

interface IXcm {
    struct Weight {
        uint64 refTime;
        uint64 proofSize;
    }
    function execute(bytes calldata message, uint64 refTime, uint64 proofSize) external;
    function send(bytes calldata destination, bytes calldata message) external;
    function weighMessage(bytes calldata message) external view returns (Weight memory weight);
}

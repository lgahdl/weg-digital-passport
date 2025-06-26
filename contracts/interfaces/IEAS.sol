// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IEAS
 * @dev Interface for the Ethereum Attestation Service contract
 */
interface IEAS {
    struct Attestation {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }

    struct AttestationRequest {
        bytes32 schema;
        AttestationRequestData data;
    }

    struct AttestationRequestData {
        address recipient;
        uint64 expirationTime;
        bool revocable;
        bytes32 refUID;
        bytes data;
        uint256 value;
    }

    struct MultiAttestationRequest {
        bytes32 schema;
        AttestationRequestData[] data;
    }

    struct RevocationRequest {
        bytes32 schema;
        RevocationRequestData data;
    }

    struct RevocationRequestData {
        bytes32 uid;
        uint256 value;
    }

    struct MultiRevocationRequest {
        bytes32 schema;
        RevocationRequestData[] data;
    }

    event Attested(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schema);
    event Revoked(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schema);

    function getSchemaRegistry() external view returns (address);
    
    function attest(AttestationRequest calldata request) external payable returns (bytes32);
    
    function attestByDelegation(
        AttestationRequest calldata request,
        bytes calldata signature
    ) external payable returns (bytes32);
    
    function multiAttest(MultiAttestationRequest[] calldata multiRequests) external payable returns (bytes32[] memory);
    
    function multiAttestByDelegation(
        MultiAttestationRequest[] calldata multiRequests,
        bytes[] calldata signatures
    ) external payable returns (bytes32[] memory);
    
    function revoke(RevocationRequest calldata request) external payable;
    
    function revokeByDelegation(
        RevocationRequest calldata request,
        bytes calldata signature
    ) external payable;
    
    function multiRevoke(MultiRevocationRequest[] calldata multiRequests) external payable;
    
    function multiRevokeByDelegation(
        MultiRevocationRequest[] calldata multiRequests,
        bytes[] calldata signatures
    ) external payable;
    
    function getAttestation(bytes32 uid) external view returns (Attestation memory);
    
    function isAttestationValid(bytes32 uid) external view returns (bool);
    
    function getTimestamp(bytes32 uid) external view returns (uint64);
    
    function getRevokeOffchain(address revoker, bytes32 data) external view returns (uint64);
    
    function revokeOffchain(bytes32 data) external returns (uint64);
} 
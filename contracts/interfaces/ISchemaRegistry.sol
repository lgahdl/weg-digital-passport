// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISchemaRegistry
 * @dev Interface for the Schema Registry contract
 */
interface ISchemaRegistry {
    struct SchemaRecord {
        bytes32 uid;
        address resolver;
        bool revocable;
        string schema;
    }

    event Registered(bytes32 indexed uid, address indexed registerer, string schema);

    function register(
        string calldata schema,
        address resolver,
        bool revocable
    ) external returns (bytes32);

    function getSchema(bytes32 uid) external view returns (SchemaRecord memory);
} 
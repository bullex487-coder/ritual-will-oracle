// contracts/OracleVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title OracleVault
 * @notice Stores AI-generated predictions permanently on the Ritual blockchain.
 *         Each prediction is immutable once stored — a permanent oracle record.
 * @dev Deployed on Ritual Testnet (Chain ID: 1979)
 */
contract OracleVault {
    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Prediction {
        uint256 id;
        string question;        // The future question asked
        string outcome;         // "YES" | "NO" | "UNCERTAIN"
        uint8 confidence;       // 0–100 confidence score
        string reasoning;       // AI reasoning summary
        string category;        // "Crypto" | "Politics" | "Tech" | "Sports" | "General"
        address analyst;        // Wallet that submitted the prediction
        uint256 timestamp;      // Block timestamp at storage time
    }

    // ─── State ────────────────────────────────────────────────────────────────

    /// @dev Auto-incremented ID counter (starts at 1)
    uint256 private _nextId = 1;

    /// @dev id → Prediction mapping
    mapping(uint256 => Prediction) private _predictions;

    /// @dev address → list of prediction IDs they submitted
    mapping(address => uint256[]) private _userPredictions;

    // ─── Events ───────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a new prediction is stored on-chain.
     * @param id         The unique prediction ID
     * @param question   The question that was asked
     * @param analyst    The address that stored the prediction
     * @param confidence The AI confidence score (0–100)
     * @param timestamp  Block timestamp
     */
    event PredictionStored(
        uint256 indexed id,
        string question,
        address indexed analyst,
        uint8 confidence,
        uint256 timestamp
    );

    // ─── Write Functions ──────────────────────────────────────────────────────

    /**
     * @notice Store a new AI-generated prediction on-chain.
     * @param question   The future scenario/question that was analyzed
     * @param outcome    The AI-determined outcome: "YES", "NO", or "UNCERTAIN"
     * @param confidence Confidence score from 0 to 100
     * @param reasoning  Brief AI reasoning summary (kept short to save gas)
     * @param category   Market category (Crypto, Politics, Tech, Sports, General)
     * @return id        The unique on-chain ID of this prediction
     */
    function storePrediction(
        string calldata question,
        string calldata outcome,
        uint8 confidence,
        string calldata reasoning,
        string calldata category
    ) external returns (uint256 id) {
        require(bytes(question).length > 0, "OracleVault: question is empty");
        require(bytes(outcome).length > 0, "OracleVault: outcome is empty");
        require(confidence <= 100, "OracleVault: confidence out of range");

        id = _nextId++;

        _predictions[id] = Prediction({
            id: id,
            question: question,
            outcome: outcome,
            confidence: confidence,
            reasoning: reasoning,
            category: category,
            analyst: msg.sender,
            timestamp: block.timestamp
        });

        _userPredictions[msg.sender].push(id);

        emit PredictionStored(id, question, msg.sender, confidence, block.timestamp);
    }

    // ─── Read Functions ───────────────────────────────────────────────────────

    /**
     * @notice Retrieve a prediction by its ID.
     * @param id The prediction ID to look up
     * @return   The full Prediction struct
     */
    function getPrediction(uint256 id) external view returns (Prediction memory) {
        require(id > 0 && id < _nextId, "OracleVault: prediction not found");
        return _predictions[id];
    }

    /**
     * @notice Get the total number of predictions stored.
     * @return Total prediction count
     */
    function getTotalPredictions() external view returns (uint256) {
        return _nextId - 1;
    }

    /**
     * @notice Get all prediction IDs submitted by a specific address.
     * @param user The wallet address to query
     * @return     Array of prediction IDs
     */
    function getUserPredictions(address user) external view returns (uint256[] memory) {
        return _userPredictions[user];
    }
}

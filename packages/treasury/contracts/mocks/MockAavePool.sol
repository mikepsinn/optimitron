// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockERC20.sol";

/**
 * @title MockAToken — Aave-style yield-bearing receipt token (test only)
 * @notice The pool contract controls mint/burn. Balance increases simulate yield.
 */
contract MockAToken is MockERC20 {
    address public pool;

    constructor() MockERC20("Aave Mock aUSDC", "aUSDC", 6) {}

    function setPool(address _pool) external {
        require(pool == address(0), "pool already set");
        pool = _pool;
    }

    function poolMint(address to, uint256 amount) external {
        require(msg.sender == pool, "only pool");
        _mint(to, amount);
    }

    function poolBurn(address from, uint256 amount) external {
        require(msg.sender == pool, "only pool");
        _burn(from, amount);
    }
}

/**
 * @title MockAavePool — Simulates Aave V3 Pool for unit tests
 * @notice supply() takes underlying + mints aTokens, withdraw() burns aTokens + returns underlying.
 *         simulateYield() mints extra aTokens + underlying to simulate interest accrual.
 */
contract MockAavePool {
    MockAToken public aToken;
    IERC20 public underlying;

    constructor(address _underlying, address _aToken) {
        underlying = IERC20(_underlying);
        aToken = MockAToken(_aToken);
    }

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 /* referralCode */
    ) external {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        aToken.poolMint(onBehalfOf, amount);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256) {
        aToken.poolBurn(msg.sender, amount);
        IERC20(asset).transfer(to, amount);
        return amount;
    }

    /**
     * @notice Simulate yield accrual — mints aTokens to holder and underlying to pool.
     *         In real Aave, yield comes from borrowers. Here we just inflate both sides.
     */
    function simulateYield(address holder, uint256 yieldAmount) external {
        aToken.poolMint(holder, yieldAmount);
        MockERC20(address(underlying)).mint(address(this), yieldAmount);
    }
}

// AUTO-GENERATED from AritohamDataReader.sol (solc 0.8.26). Do not edit by hand.
export const readerAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_store",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "LEVELS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_PAGE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SCAN",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SHARE_STEP",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDaoOverview",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "cycle",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "contractDeposit",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pool",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lifetimeHolders",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "weeklyEligible",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "valuePerShare",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReader.DaoOverview",
        "name": "o",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      }
    ],
    "name": "getDashboard",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint32",
            "name": "userId",
            "type": "uint32"
          },
          {
            "internalType": "address",
            "name": "referrer",
            "type": "address"
          },
          {
            "internalType": "uint32",
            "name": "referrerId",
            "type": "uint32"
          },
          {
            "internalType": "uint40",
            "name": "joinedAt",
            "type": "uint40"
          },
          {
            "internalType": "uint256",
            "name": "totalMinted",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "direct",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "reward",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "generation",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "dao",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "rankIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "rankIncentive",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "total",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "today",
                "type": "uint256"
              }
            ],
            "internalType": "struct AritohamDataReader.IncomeView",
            "name": "income",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "directBusiness",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "teamBusiness",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "matchingBusiness",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "weeklyMatching",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "dailyMatching",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "directMembers",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "activeDirects",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "totalMembers",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "contributingMembers",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "levelEligibility",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "todayDirectBusiness",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "todayTeamBusiness",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "todayNewMembers",
                "type": "uint256"
              }
            ],
            "internalType": "struct AritohamDataReader.BusinessView",
            "name": "business",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint8",
                "name": "current",
                "type": "uint8"
              },
              {
                "internalType": "string",
                "name": "currentName",
                "type": "string"
              },
              {
                "internalType": "uint8",
                "name": "next",
                "type": "uint8"
              },
              {
                "internalType": "string",
                "name": "nextName",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "matchingNow",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "matchingTarget",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "progressBps",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "rewardOnCompletion",
                "type": "uint256"
              }
            ],
            "internalType": "struct AritohamDataReader.RankProgress",
            "name": "rank",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sellLimit",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "sellLeft",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "withdrawLimit",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "withdrawLeft",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "totalWithdrawn",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "availableEstimate",
                "type": "uint256"
              }
            ],
            "internalType": "struct AritohamDataReader.LimitView",
            "name": "limits",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "cycle",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "contractDeposit",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "pool",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "lifetimeHolders",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "weeklyEligible",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "totalShares",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "valuePerShare",
                "type": "uint256"
              }
            ],
            "internalType": "struct AritohamDataReader.DaoOverview",
            "name": "dao",
            "type": "tuple"
          }
        ],
        "internalType": "struct AritohamDataReader.Dashboard",
        "name": "d",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getDirectIncomeHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "uint32",
            "name": "fromId",
            "type": "uint32"
          },
          {
            "internalType": "uint256",
            "name": "minted",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "income",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "commissionBps",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReader.DirectItem[]",
        "name": "page",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalIncome",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getEmissionHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "uint32",
            "name": "stakeIndex",
            "type": "uint32"
          },  
          {
            "internalType": "uint32",
            "name": "periods",
            "type": "uint32"
          },
          {
            "internalType": "uint256",
            "name": "base",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "earned",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "percentBps",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReader.RoiItem[]",
        "name": "page",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalClaimed",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getGenerationHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "uint32",
            "name": "fromId",
            "type": "uint32"
          },
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "base",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "income",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "percentBps",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReader.GenItem[]",
        "name": "page",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalIncome",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getParticipationHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "uint40",
            "name": "blockNo",
            "type": "uint40"
          },
          {
            "internalType": "uint256",
            "name": "usdt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokens",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rewardAmount",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReader.PurchaseItem[]",
        "name": "page",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "n",
        "type": "uint256"
      }
    ],
    "name": "getPriceHistory",
    "outputs": [
      {
        "internalType": "uint40[]",
        "name": "times",
        "type": "uint40[]"
      },
      {
        "internalType": "uint256[]",
        "name": "prices",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "incentive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getRankHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "uint8",
            "name": "rank",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "rankName",
            "type": "string"
          },
          {
            "internalType": "uint64",
            "name": "refId",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReader.RankItem[]",
        "name": "page",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      }
    ],
    "name": "getRankRoadmap",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "rank",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "selfMinted",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "directs",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "matching",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "incentiveBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "incomeAmount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "achieved",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "next",
            "type": "bool"
          }
        ],
        "internalType": "struct AritohamDataReader.RankRow[9]",
        "name": "rows",
        "type": "tuple[9]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getSellHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "uint256",
            "name": "aritoham",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "usdt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReader.SellItem[]",
        "name": "page",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      }
    ],
    "name": "getSellSummary",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "aritohamSold",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "usdtReceived",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limitLeft",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "sales",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getStakes",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "uint256",
            "name": "usdt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokens",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "claimed",
            "type": "uint256"
          },
          {
            "internalType": "uint32",
            "name": "claims",
            "type": "uint32"
          }
        ],
        "internalType": "struct AritohamDataReader.StakeItem[]",
        "name": "page",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getWithdrawHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "fee",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokens",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReader.WithdrawItem[]",
        "name": "page",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "r",
        "type": "uint256"
      }
    ],
    "name": "rankName",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "store",
    "outputs": [
      {
        "internalType": "contract IAritohamDataStore",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

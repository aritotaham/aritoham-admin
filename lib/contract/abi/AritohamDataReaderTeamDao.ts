// AUTO-GENERATED from AritohamDataReaderTeamDao.sol (solc 0.8.26). Do not edit by hand.
export const readerTeamDaoAbi = [
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "cycle",
        "type": "uint256"
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
    "name": "getCycleMembers",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "wallet",
            "type": "address"
          },
          {
            "internalType": "uint32",
            "name": "id",
            "type": "uint32"
          },
          {
            "internalType": "bool",
            "name": "lifetime",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "weeklyMatching",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nextTierNeeded",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "shares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "estReward",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReaderTeamDao.DaoMemberItem[]",
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
        "name": "cycle",
        "type": "uint256"
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
    "name": "getCyclePayouts",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint32",
            "name": "cycle",
            "type": "uint32"
          },
          {
            "internalType": "address",
            "name": "wallet",
            "type": "address"
          },
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "uint256",
            "name": "weeklyMatching",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "shares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "shareValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "payout",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReaderTeamDao.DaoPayoutItem[]",
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
        "name": "cycle",
        "type": "uint256"
      }
    ],
    "name": "getCycleSummary",
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
            "name": "totalDeposit",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pool",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "members",
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
          },
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "bool",
            "name": "paid",
            "type": "bool"
          }
        ],
        "internalType": "struct AritohamDataReaderTeamDao.CycleSummary",
        "name": "s",
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
    "name": "getMyDaoPayouts",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint32",
            "name": "cycle",
            "type": "uint32"
          },
          {
            "internalType": "address",
            "name": "wallet",
            "type": "address"
          },
          {
            "internalType": "uint40",
            "name": "time",
            "type": "uint40"
          },
          {
            "internalType": "uint256",
            "name": "weeklyMatching",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "shares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "shareValue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "payout",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReaderTeamDao.DaoPayoutItem[]",
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
    "name": "getMyDaoStatus",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bool",
            "name": "lifetime",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "windowOpen",
            "type": "bool"
          },
          {
            "internalType": "uint40",
            "name": "activatedAt",
            "type": "uint40"
          },
          {
            "internalType": "uint40",
            "name": "windowEnd",
            "type": "uint40"
          },
          {
            "internalType": "uint256",
            "name": "windowDirect",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "directTarget",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "windowMatching",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "matchingTarget",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "qualifiedByWindow",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "weeklyMatching",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "qualifiedShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "shortfall",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "weeklyProgressBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "estWeeklyPayout",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReaderTeamDao.DaoStatus",
        "name": "s",
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
        "name": "root",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "level",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "onlyInvested",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "daoOnly",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "rank",
            "type": "uint256"
          }
        ],
        "internalType": "struct AritohamDataReaderTeamDao.TeamFilter",
        "name": "f",
        "type": "tuple"
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
    "name": "getTeam",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "wallet",
            "type": "address"
          },
          {
            "internalType": "uint32",
            "name": "id",
            "type": "uint32"
          },
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "rank",
            "type": "uint8"
          },
          {
            "internalType": "uint40",
            "name": "joinedAt",
            "type": "uint40"
          },
          {
            "internalType": "uint256",
            "name": "selfStaked",
            "type": "uint256"
          },
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
            "internalType": "uint32",
            "name": "directCount",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "teamCount",
            "type": "uint32"
          },
          {
            "internalType": "bool",
            "name": "daoPartner",
            "type": "bool"
          }
        ],
        "internalType": "struct AritohamDataReaderTeamDao.MemberItem[]",
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
    "name": "getTeamSummary",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "directs",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "directContribution",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalMembers",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "contributing",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "teamBusiness",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "visibleLevels",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
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

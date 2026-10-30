export type NavItem = {
  href: string;
  label: string;
  icon: string;
  group: "read" | "write";
  roleTag?: string;
};

export const NAV: NavItem[] = [
  // READ PAGES (1 - 5)
  {
    href: "/",
    label: "1. All Users & Incomes",
    icon: "users",
    group: "read",
    roleTag: "Withdraw · Balance · Minted · Incomes",
  },
  {
    href: "/stakes",
    label: "2. All Users Stakes",
    icon: "briefcase",
    group: "read",
    roleTag: "All Stakes · ROI · Filter",
  },
  {
    href: "/ranks",
    label: "3. All Users Ranks",
    icon: "crown",
    group: "read",
    roleTag: "Qualified to Upgrade · Rank Info",
  },
  {
    href: "/dao",
    label: "4. All Users DAO Status",
    icon: "gem",
    group: "read",
    roleTag: "Eligible · Shares · DAO Details",
  },
  {
    href: "/teams",
    label: "5. All Users Team View",
    icon: "network",
    group: "read",
    roleTag: "Team Business · Members · Tree",
  },

  // WRITE PAGES (6 - 11)
  {
    href: "/write/rank-reward",
    label: "6. Rank Reward",
    icon: "award",
    group: "write",
    roleTag: "Filter Qualified · Select & Tx",
  },
  {
    href: "/write/rank-incentive",
    label: "7. Rank Incentive",
    icon: "dollar",
    group: "write",
    roleTag: "Filter Eligible · Select & Tx",
  },
  {
    href: "/write/dao-eligible",
    label: "8. Set DAO Eligible",
    icon: "usercheck",
    group: "write",
    roleTag: "setDaoEligible(wallets, shares)",
  },
  {
    href: "/write/dao-distribute",
    label: "9. Distribute DAO Share",
    icon: "coins",
    group: "write",
    roleTag: "distributeDao(count)",
  },
  {
    href: "/write/tokens-security",
    label: "10. Burn, Blacklist & Reset",
    icon: "flame",
    group: "write",
    roleTag: "burnFrom · Blacklist · DAO/Rank Reset",
  },
  {
    href: "/write/governance",
    label: "11. Keeper & Renounce",
    icon: "shield",
    group: "write",
    roleTag: "setChainKeeper · Renounce Protocol/Token",
  },
];

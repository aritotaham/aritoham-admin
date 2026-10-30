import { config } from "./contract";

export const BRAND = {
  name: "ARITOHAM",
  sub: "Admin Console",
  token: "ARITOHAM",
  userPrefix: "ARI",
  domain: "aritoham.com",
  get protocolContract() {
    return config.addresses.protocol;
  },
  get tokenContract() {
    return config.addresses.aritoham;
  },
};

export const DEMO_ADDRESS = "0x0000000000000000000000000000000000000000";

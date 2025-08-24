import { contracts } from "@polkadot-api/descriptors"
import * as hotpotatoPassethub from "contracts/deployments/hotpotato/passethub"
import * as hotpotatoPop from "contracts/deployments/hotpotato/pop"
// import * as hotpotatoDev from "contracts/deployments/hotpotato/dev"

export const hotpotato = {
  contract: contracts.hotpotato,
  evmAddresses: {
    // dev: hotpotatoDev.evmAddress,
    pop: hotpotatoPop.evmAddress,
    passethub: hotpotatoPassethub.evmAddress,
    // Add more deployments here
  },
  ss58Addresses: {
    // dev: hotpotatoDev.ss58Address,
    pop: hotpotatoPop.ss58Address,
    passethub: hotpotatoPassethub.ss58Address,
    // Add more deployments here
  },
}

export const deployments = {
  hotpotato,
  // Add more contracts here
}

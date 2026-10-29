# Live workshop records

Network: **Stable Studionet 61999**. [Canonical contract](https://explorer-studio.genlayer.com/address/0x600573f2629cDFD0151723B5892B22A28877840a).

The recorded browser frontend uses a temporary, locally generated Studio signing account. It submits zero-value transactions in Normal / full-consensus mode. Source verification compares the deployed contract against the published SHA-256. Successful writes are bound to the saved sender, destination, method and complete arguments, then read back from finalized game state.

## Inspect without signing

Open [MENDWIND](https://halihalibt.github.io/mendwind-genlayer/), choose **On GenLayer → Read verified example**. No wallet is required. The application verifies source identity and calls `get_game` with `LATEST_FINAL`. The supply cupboard, repair progress and journal are populated from that current response. **Export journal** downloads the loaded state.

The public website's [journal export](evidence/public-journal.json) was downloaded and checked against revision 2.

Game ID: `0x1e4fffbe0e16502059c4c2358b9a0d8ed63cf075:afternoon-mvttetsf`.

## Finalized records

| Event | Transaction | Observed result |
| --- | --- | --- |
| Deploy canonical contract | [0x5385893d…](https://explorer-studio.genlayer.com/tx/0x5385893da087d6eeb67297efa7c3dc7c2bb3d16088a5b812d84886e2a0889695) | FINALIZED / SUCCESS; byte-identical source |
| Open workshop | [0x7936f6bc…](https://explorer-studio.genlayer.com/tx/0x7936f6bce9a1cde5cc689437087d53c8c3598407c06f137c587cec07e5adf88d) | OPEN; stock `[2,2,2,1]` |
| Ask for magical new supplies | [0x67bcc560…](https://explorer-studio.genlayer.com/tx/0x67bcc560f171db4de55ea7fc5bf2c8551b6a12bd8e3bb028cbf8de5ded03ea47) | UNSUPPORTED; stock unchanged |
| Patch windmill sail and oil axle | [0x283edc92…](https://explorer-studio.genlayer.com/tx/0x283edc92370107127eb4d68a4d6eab647d08276b0487ec20a156b16caa45f6f6) | Windmill MENDED; stock `[1,2,1,1]` |

Every row above reached `FINALIZED / SUCCESS` and `MAJORITY_AGREE`. An unsupported plan is a recorded business outcome, not a transaction failure. [Transaction extracts and readbacks](evidence/verified-transactions.json) preserve the observed fields and consensus votes; bulky node configuration is omitted.

## Verification boundary

Local coverage: 12 JavaScript tests plus 15 mocked-host Python tests. The tests cover restoration, irreversible salvage, atomic material checks, duplicate actions, request idempotency, owner permissions, stale revisions, attempt limits, exact quote constraints, independent-validator rejection, decoded-argument binding, leader-only rejection and network-timeout reporting. Mocked-host tests do not claim live validator consensus.

The next live action, [postal glider repair](https://explorer-studio.genlayer.com/tx/0xf82c2abe40312f21b3ea4b4084b8dc7b13920776e2487f1e98a957cf8630ef9a), finalized with `NO_MAJORITY / ERROR`: `CONSENSUS_LEADER_EXEC_TIMEOUT`, with stderr `Leader execution exceeded 600.000s`. It is retained in the transaction extracts, does not count as a successful repair, and was not resubmitted. The finalized game remains OPEN at revision 2, with the windmill mended and stock `[1,2,1,1]`. Three-object restoration and salvage are tested locally, not claimed as completed live outcomes.

The Sketchbook uses prewritten local rules and is explicitly labelled. It is never a substitute for a chain result. No real repair, supply provenance, independent human participation or physical safety is asserted. The injected-extension wallet path is available, but this record set uses the temporary Studio player path.

The first deployment failed because its counter storage used an unsized `int`. It created no usable game. The canonical source uses `u32`; its successful replacement is the deployment linked above. [Initial failure receipt and runtime error](evidence/initial-deployment.json) are retained. No appeal or automatic write retry was used.

Studionet may reset. Preserved records document the observed state and do not guarantee perpetual network availability.

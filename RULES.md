# The little workshop's rules

## Supplies and recipes

Each workshop begins with `[cloth 2, wood 2, oil 2, metal 1]`.

| Object | Operation | Cost |
| --- | --- | --- |
| Windmill | Patch its torn sail | 1 cloth |
| Windmill | Oil its seized axle | 1 oil |
| Postal glider | Brace its cracked wooden wing rib | 1 wood |
| Postal glider | Patch its torn fabric wing | 1 cloth |
| Village postbox | Replace its rotten panel | 1 wood |
| Village postbox | Oil its latch **and** replace its metal spring | 1 oil + 1 metal |

Each operation is one indivisible fixed recipe. Mentioning more supplies in the prose does not change the recipe price. One plan may contain one or two operations for the selected object. It cannot add other targets or unsupported work. The postbox latch recipe requires both named steps.

Clear plans execute only if every requested operation is new and every required part is available. Otherwise nothing is deducted and the journal records `ALREADY_DONE` or `NO_MATERIAL`. `UNCLEAR` and `UNSUPPORTED` interpretations also spend nothing. These business outcomes are successful recorded attempts, distinct from failed execution or consensus disagreement.

## Salvage

Salvage cannot be combined with repair. It permanently changes an unresolved object to `SALVAGED` and adds its fixed component allowance:

| Object | Reclaimed allowance |
| --- | --- |
| Windmill | 1 wood + 1 metal |
| Postal glider | 1 cloth + 1 wood |
| Village postbox | 1 wood + 1 metal |

These are fictional game allowances, not physical mass accounting. Repaired materials are not separately refunded. An object can be salvaged only once and cannot be repaired afterward. Fully mended objects are already resolved and cannot be salvaged.

## Endings

Every finalized recorded attempt advances the revision by one, even if no material is spent. All six repairs produce `RESTORED`. Resolving every object through a mixture of repair and salvage, or reaching twelve attempts, produces `CLOSED`. No more new actions are permitted after either ending. An identical request replay returns the same record without spending materials or advancing time.

## Shared execution

`open_workshop(slug)` creates a namespaced game for the caller. Only that owner can call `act(game_id, expected_revision, action_id, target, plan)`. Another person may read it publicly. Each player may create at most 32 workshops; this is an address limit, not Sybil resistance.

The semantic boundary independently reinterprets the original plan on each validator. Agreement covers the decision and every operation, not just the aggregate repair result. Exact quotations must occur in the submitted plan. Text is data, not instructions to change the interpreter. Invalid model responses or failed consensus do not become `UNCLEAR` records; they fail without advancing the game.

The interface accepts only finalized successful execution, checks the signed sender/contract/method/arguments and reads back the matching game state. Pending transactions are saved locally and never automatically resubmitted. Studionet can reset; historical evidence does not guarantee perpetual availability.

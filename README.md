# MENDWIND

**A little care goes a long way.** A hand-painted repair game set in a workshop above the clouds.

[Open the workshop](https://halihalibt.github.io/mendwind-genlayer/) · [Rules](RULES.md) · [Contract](contracts/mendwind.py) · [Network records](EVIDENCE.md)

![MENDWIND live website](media/preview.jpg)

**Verified workshop: RESTORED · 6/6 repairs · zero remaining materials.** Choose **On GenLayer → Read verified example** to read the completed game without a wallet. [Finalized receipts and public export](EVIDENCE.md).

A windmill, a postal glider and a village postbox need care. The cupboard holds two cloth patches, two pieces of wood, two portions of oil and one metal part. Describe a repair in your own words. GenLayer independently interprets the plan; deterministic contract code applies fixed recipes to a persistent, finite inventory. Repair all three objects within twelve attempts to restore the valley.

## Play

- **Sketchbook:** a wallet-free introduction using prewritten local choices. No model calls or transactions occur in this mode.
- **On GenLayer:** free-text repair plans, signed transactions, automatic finality tracking, exact deployed-source verification and finalized state readback.
- **Read verified example:** inspect a published workshop without a wallet. Its supplies, repairs and journal come from the current finalized chain response.
- **Export journal** and **Export execution log:** download game state and transaction records separately.

Use an injected EIP-1193 wallet or **Free Studio player** on Stable Studionet, chain **61999**. Temporary signing accounts exist only in the current tab's memory; refreshing discards them. Never fund a temporary address. No private-key input, payments, tradable assets or prizes are involved.

## Why consensus belongs in the game

A free-text action is not a score. The contract's leader and validators independently map the original plan to the complete supported operation set. Negated, vague, magical and incomplete actions cannot silently become repairs. Every operation label must agree; explanatory quote spans may differ. The model cannot select arbitrary resource amounts, add supplies, overwrite an object or declare victory.

After consensus, code checks the whole operation set before changing anything. A missing part blocks all requested repairs. Repeating an action cannot charge or reward it twice. Salvage permanently retires the object and returns a fixed, once-only component allowance. Every accepted attempt enforces `remaining + spent = initial + reclaimed` for each material. Owner authorization, revisions and request identity protect the same persistent game state.

All materials and objects are fictional. Consensus checks interpretation of the game plan; it does not validate real repairs or physical safety. The bounded six-repair catalogue is intentional, rather than an open-world crafting engine.

## Run locally

Node.js 22+ and Python 3.12+:

```sh
npm ci
npm test
python -m unittest discover -s contract-tests -v
npm run dev
```

`npm run build` synchronizes the canonical contract and source digest, then builds `dist/`. Relative asset paths support GitHub Pages repository subpaths. No paid API key, backend or server wallet is needed. The workflow in `.github/workflows/pages.yml` checks the rules and publishes the static build.

## Project map

| Path | Purpose |
| --- | --- |
| `contracts/mendwind.py` | Complete Intelligent Contract and independent semantic validator |
| `src/game.js` | Clearly labelled practice rules and display catalogue |
| `src/chain.js` | SDK integration, signing, source verification and transaction recovery |
| `src/main.js`, `src/style.css` | Interactive illustrated workshop, journal and bilingual interface |
| `public/deployment.json` | Canonical deployment identity and verified-example reference |
| `evidence/` | Preserved observed network records |
| `contract-tests/`, `tests/` | Mocked-host protocol tests and frontend rule/intent tests |

## Art and sound

The original setting combines a hand-painted summer valley, timber workshop, wind-powered machinery, paper textures and restrained botanical colors. Wind-borne seeds, pointer parallax, material feedback and a living journal carry the interaction. Reduced-motion settings suppress decorative motion.

The original 106-second pastoral score uses gentle piano, flute, celesta and soft strings. Sound starts enabled; playback begins automatically when allowed or after the first click/touch under browser autoplay rules. The sound button mutes it. No film soundtrack, external sample or existing character is included.

Source code and original project assets are provided under the [MIT License](LICENSE). Dependencies retain their respective licenses. Display fonts are supplied by Google Fonts under their respective open font licenses.

# ADR 0002: Versioned device profiles

## Context

Device Profiles describe reusable hardware families. Deployed Devices must remain understandable and stable when a profile is edited for later hardware revisions.

## Decision

Devices reference an immutable Device Profile Version. Channel Definitions belong to that version. Creating a Device transactionally creates one concrete Device Channel for every Channel Definition in the selected published version.

Published versions have no mutation API. A changed channel contract requires a new version.

## Alternatives

- Referencing only Device Profile would allow later edits to silently alter deployed hardware contracts.
- Copying every channel field directly into Device would lose reusable profile identity and make upgrades difficult to reason about.

## Consequences

- Historical and deployed Devices retain a stable physical contract.
- Profile changes are explicit and versioned.
- Device Channels have independent identities for future Point Mapping and runtime state.
- Upgrading a Device between versions will require an explicit migration workflow later.

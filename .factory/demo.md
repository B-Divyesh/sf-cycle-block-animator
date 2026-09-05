# Cycle Blocks demo sandbox

Demo URL: <https://cycle-block-animator.sociobot.in/demo/>

The demo creates four original 96 × 96 firefly PNG frames in browser memory. Its
cycle block repeats the four frames three times with a one-frame pass offset. The
prepared 12-frame sheet uses 12 FPS, 4 px padding, a 1024 px texture limit, and a
64 KiB PNG budget.

Use **Reset demo** to rebuild that exact sample. Use **Start for real** to discard
the in-memory demo and return to the separately stored real project.

Demo mode does not open or write the real `cycle-blocks` IndexedDB database. It
does not read the real license keys in localStorage. The sample has no persistence
namespace because all demo state is discarded on navigation; this is stricter than
a separate `demo:` storage namespace.

Every command in [claims.json](claims.json) starts from `/demo/` in a fresh browser
context. The isolation check seeds real data first, changes and resets the demo,
then confirms the saved real project is unchanged.

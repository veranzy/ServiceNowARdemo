# AR-00 — decisions

Cross-module decisions that shape every form: D3 (portal only for the project team), D4 (forms are
record producers creating an AR request case), D19 (General information on every form), D22 (forms
never change master data). Numbers below are this module's; *Was* gives the number before the
2026-11-12 restructure.

| # | Was | Question | Decision | Date |
|---|---|---|---|---|
| 1 | ARF 1 | AR forms | 16 forms numbered in Roman numerals **AR-i … AR-xvi**. AR-i and AR-ix are detailed; the rest are placeholders ("To be defined"). | 2026-11-02 |
| 2 | ARF 17 | Department sub-BU | **Sub-BU** dropdown right after Department, in General information (all AR forms). Choices depend on the department (mock list of 3 per department until the client supplies the real one). Changing the department clears it. | 2026-11-12 |
| 3 | — | Module per form | Each AR form is its own module, named by its number (AR-i, AR-ix, …); the parts every form shares live here (D27). | 2026-11-12 |

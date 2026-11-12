# AR-ix — open questions

1. What is the invoice reference number used for, and is it mandatory? (Owner)
2. ~~Should Remove GIRO pick the specific GIRO authorisation?~~ No longer applies: only one GIRO can be active per contract (decision 9).
3. ~~Is the amount per month (recurring deduction) or a cap?~~ Free text with no linkages (decision 13).
4. ~~Does the AR officer need to verify the signed GIRO form (attachment check) before activating?~~ No check: AR-ix doesn't activate GIRO; AR updates the contract, then Complete (decision 11).
5. ~~Should CC'd people be able to comment, or only view?~~ Moved to [AR-00](../AR-00/OPEN_QUESTIONS.md) question 3 (applies to every form).
6. Should a new *Add GIRO* **replace** the active GIRO instead of being blocked? Owner's note 2026-11-12: "allow to remove"; parked, the block stays for now. (Owner; [GitHub issue #2](https://github.com/veranzy/ServiceNowARdemo/issues/2))
7. Should completing an AR-ix case update the contract's GIRO automatically (flow or UI action)? Next major release, about 6 months. (Owner; [GitHub issue #4](https://github.com/veranzy/ServiceNowARdemo/issues/4))

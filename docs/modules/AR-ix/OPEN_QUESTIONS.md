# AR-ix — open questions

1. What is the invoice reference number used for, and is it mandatory? Now asked only for purpose Others (decision 15). (Owner)
2. ~~Should Remove GIRO pick the specific GIRO authorisation?~~ No longer applies: only one GIRO can be active per contract (decision 9).
3. ~~Is the amount per month (recurring deduction) or a cap?~~ Free text with no linkages (decision 13).
4. ~~Does the AR officer need to verify the signed GIRO form (attachment check) before activating?~~ No check: AR-ix doesn't activate GIRO; AR updates the contract, then Complete (decision 11).
5. ~~Should CC'd people be able to comment, or only view?~~ Moved to [AR-00](../AR-00/OPEN_QUESTIONS.md) question 3 (applies to every form).
6. ~~Should a new *Add GIRO* **replace** the active GIRO instead of being blocked?~~ No: an existing contract with GIRO active offers only Remove GIRO (decision 14). [GitHub issue #2](https://github.com/veranzy/ServiceNowARdemo/issues/2) closed 2026-11-12 (owner).
7. Should completing an AR-ix case update the contract's GIRO automatically (flow or UI action)? Next major release, about 6 months. (Owner; [GitHub issue #4](https://github.com/veranzy/ServiceNowARdemo/issues/4))
8. Verify the **Form number** field in section Others (what form, and is it needed?). Built as optional for now (decision 16). (Owner)

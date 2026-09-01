# Deploy gotchas (read before verifying live)

## Wildcard parking trap on franzai.com
`franzai.com` has a **wildcard DNS record** pointing at an easyname domain-parking
page. That means `https://knightfight.franzai.com` **already returns HTTP 200**
with a German easyname parking page BEFORE we deploy anything.

**A 200 status is therefore NOT proof of deployment.**

To ship correctly:
1. Create the Cloudflare Pages project `knightfight` and deploy `./dist`.
2. Explicitly add the **custom domain** `knightfight.franzai.com` to the Pages
   project (zone `11bfe82c00e8c9e116e1e542b140f172`). This creates a specific
   CNAME that OVERRIDES the wildcard.
3. Verify by asserting the response body **contains the Knightfight app**
   (e.g. `<title>Knightfight`, the app bundle) and **does NOT contain**
   the strings `easyname` or `domainparking`.

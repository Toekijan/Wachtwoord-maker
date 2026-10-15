# Wachtwoord Maker

Webapp die uit een appnaam en een zelfverzonnen wachtwoord altijd dezelfde veilige code maakt.

<!-- Testwijziging op ontwikkel: controleert dat een push naar deze branch geen Netlify-publicatie start. -->

## Synchronisatie tussen apparaten

De app bewaart per gebruiker een **versleutelde kluis** met je apps, de gekozen lengte en het versienummer.
De sleutel wordt in de browser afgeleid uit gebruiker + wachtwoord; de server (`netlify/functions/vault.mjs`,
opslag in Netlify Blobs) ziet alleen een onleesbare id en versleutelde bytes. Wachtwoord en codes worden nooit opgeslagen.

- Statische bestanden staan in `public/` (Netlify publiceert die map).
- De functie draait automatisch op Netlify op `/api/vault`; er is geen extra instelling of sleutel nodig.
- Tests voor de functie: `npm install && npm test`.
- Zonder server (bijvoorbeeld lokaal geopend) werkt de app gewoon, alleen op dat ene apparaat.

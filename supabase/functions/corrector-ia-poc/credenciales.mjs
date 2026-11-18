// Validación local de secretos: no transmite, almacena, expone ni registra valores.
// Resultado booleano solamente; ningún valor derivado (longitud, prefijo, hash).
export function diagnosticarCredenciales(accountId, apiToken) {
  const cuenta = typeof accountId === "string" && /^[a-f0-9]{32}$/i.test(accountId);
  const token = typeof apiToken === "string" &&
    /^[\x21-\x7e]{20,256}$/.test(apiToken) && !/^Bearer\s/i.test(apiToken);
  let cabecera = false;
  if (token) {
    try {
      new Request("https://api.cloudflare.com/client/v4/user/tokens/verify", {
        headers: { Authorization: "Bearer " + apiToken }
      });
      cabecera = true;
    } catch {
      cabecera = false;
    }
  }
  return { cuenta, token, cabecera };
}

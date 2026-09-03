export type Os = "windows" | "macos";

export const detectedOs: Os = navigator.userAgent.includes("Mac") ? "macos" : "windows";

/** Cloudflare, dans les deux familles : sans l'IPv6, la plupart des box continuent
 * d'interroger le DNS de l'operateur et le blocage reste actif. */
export const DNS_IPV4 = ["1.1.1.1", "1.0.0.1"];
export const DNS_IPV6 = ["2606:4700:4700::1111", "2606:4700:4700::1001"];

/** Applique les quatre adresses a toutes les cartes actives, puis vide le cache. */
export const DNS_PS_COMMAND = `Get-NetAdapter | Where-Object Status -eq "Up" | Set-DnsClientServerAddress -ServerAddresses ("${DNS_IPV4.join('","')}","${DNS_IPV6.join('","')}"); ipconfig /flushdns`;

export const DNS_MAC_COMMAND = `networksetup -listallnetworkservices | tail -n +2 | while read s; do sudo networksetup -setdnsservers "$s" ${DNS_IPV4.join(" ")} ${DNS_IPV6.join(" ")}; done; sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`;

/**
 * @file cbomToCsv.js
 * @description Service to convert a Cryptographic Bill of Materials (CBOM) document into a standard CSV format.
 */

function cbomToCsv(cbom) {
  const escapeCsv = (val) => {
    if (val === undefined || val === null) return "";
    let str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  let rows = [];

  // Metadata Header
  rows.push(["Cryptographic Bill of Materials (CBOM) Report"]);
  rows.push(["Generated At", cbom.generatedAt ? new Date(cbom.generatedAt).toLocaleString() : new Date().toLocaleString()]);
  rows.push(["Scan Mode", cbom.mode === 'per_asset' ? 'Per-Asset' : 'Aggregate']);
  rows.push([]); // blank line

  // 1. Algorithms
  rows.push(["--- ALGORITHMS ---"]);
  rows.push(["Name", "Asset", "Asset Type", "Primitive", "Mode", "Security Level", "OID"]);
  if (cbom.algorithms && cbom.algorithms.length > 0) {
    cbom.algorithms.forEach(a => {
      rows.push([
        a.name || "",
        a.asset || "",
        a.assetType || "",
        a.primitive || "",
        a.mode || "",
        a.classicalSecurityLevel ? `${a.classicalSecurityLevel} Bits` : "",
        a.oid || ""
      ]);
    });
  } else {
    rows.push(["None"]);
  }
  rows.push([]); // blank line

  // 2. Keys
  rows.push(["--- KEYS ---"]);
  rows.push(["Name", "Asset", "Asset Type", "Size", "State", "Creation Date", "Activation Date", "ID"]);
  if (cbom.keys && cbom.keys.length > 0) {
    cbom.keys.forEach(k => {
      rows.push([
        k.name || "",
        k.asset || "",
        k.assetType || "",
        k.size ? `${k.size} Bits` : "",
        k.state || "",
        k.creationDate || "",
        k.activationDate || "",
        k.id || ""
      ]);
    });
  } else {
    rows.push(["None"]);
  }
  rows.push([]); // blank line

  // 3. Protocols
  rows.push(["--- PROTOCOLS ---"]);
  rows.push(["Name", "Asset", "Version", "Cipher Suites", "ALPN", "OID"]);
  if (cbom.protocols && cbom.protocols.length > 0) {
    cbom.protocols.forEach(p => {
      const versionStr = Array.isArray(p.version) ? p.version.join(", ") : (p.version || "");
      const suitesStr = (p.cipherSuites || []).join("; ");
      rows.push([
        p.name || "",
        p.asset || "",
        versionStr,
        suitesStr,
        p.alpn || "",
        p.oid || ""
      ]);
    });
  } else {
    rows.push(["None"]);
  }
  rows.push([]); // blank line

  // 4. Certificates
  rows.push(["--- CERTIFICATES ---"]);
  rows.push([
    "Asset",
    "Format",
    "Fingerprint SHA256",
    "Subject Name",
    "Issuer Name",
    "Not Before",
    "Not After",
    "Signature Algorithm",
    "Subject Public Key",
    "Trust Chain"
  ]);
  if (cbom.certificates && cbom.certificates.length > 0) {
    cbom.certificates.forEach(c => {
      const chainStr = (c.certificateChain || [])
        .map(node => `${node.subject} (Issued by: ${node.issuer})`)
        .join(" -> ");

      rows.push([
        c.asset || "",
        c.leafCertificate?.certificateFormat || "",
        c.leafCertificate?.fingerprintSha256 || "",
        c.leafCertificate?.subjectName || "",
        c.leafCertificate?.issuerName || "",
        c.leafCertificate?.validityPeriod?.notBefore || "",
        c.leafCertificate?.validityPeriod?.notAfter || "",
        c.leafCertificate?.signatureAlgorithmReference || "",
        c.leafCertificate?.subjectPublicKeyReference || "",
        chainStr
      ]);
    });
  } else {
    rows.push(["None"]);
  }
  rows.push([]); // blank line

  // 5. Failed Assets
  rows.push(["--- FAILED ASSETS ---"]);
  rows.push(["Host", "Failure Reason"]);
  if (cbom.failedAssets && cbom.failedAssets.length > 0) {
    cbom.failedAssets.forEach(f => {
      rows.push([
        f.host || "",
        f.reason || "HANDSHAKE_TIMEOUT"
      ]);
    });
  } else {
    rows.push(["None"]);
  }

  // Convert to CSV string with escaping
  return rows.map(row => row.map(escapeCsv).join(",")).join("\r\n");
}

module.exports = cbomToCsv;

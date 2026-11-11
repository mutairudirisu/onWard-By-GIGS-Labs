import { PdfBuilder, ascii, asciiFold, esc, fit, measure, wrap } from "./pdf.mts";

const BS = String.fromCharCode(92);
const E_ACUTE = String.fromCharCode(0xe9);
const O_DOT = String.fromCharCode(0x1ecd); // ọ - not in cp1252
const cases = [
  ["accents kept", ascii("Ad" + E_ACUTE + O_DOT + "la"), "Ad" + E_ACUTE + "ola"],
  ["naira dropped", ascii("Saved " + String.fromCharCode(0x20a6) + "5m"), "Saved 5m"],
  ["dash folded", ascii("March " + String.fromCharCode(0x2013) + " May"), "March - May"],
  ["quote folded", ascii(String.fromCharCode(0x201c) + "why" + String.fromCharCode(0x201d)), '"why"'],
];

let fail = 0;
const check = (label, ok, detail) => {
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail === undefined ? "" : ": " + detail}`);
};

for (const [label, got, want] of cases) check(label, got === want, JSON.stringify(got) + " vs " + JSON.stringify(want));

check("octal escape", esc("Ad" + E_ACUTE + O_DOT + "la") === "Ad" + BS + "351ola", esc("Ad" + E_ACUTE + O_DOT + "la"));
check("accent measured", measure("e", 10) > 0 && measure("e", 10) < 6, measure("e", 10).toFixed(2));
check("slug folds", asciiFold("Ad" + E_ACUTE + O_DOT + "la Ngo") === "Adeola Ngo", asciiFold("Ad" + E_ACUTE + O_DOT + "la Ngo"));

const doc = new PdfBuilder();
doc.line("Ad" + E_ACUTE + O_DOT + "la " + String.fromCharCode(0xd1) + String.fromCharCode(0xfc) + " " + String.fromCharCode(0xb5), 48, 60, 12, { bold: true });
doc.paragraph("Cut build time from 40 minutes to under 5. Ready to ship.", 10);
doc.bullets(["Shipped the copy", "Fixed the dot-under bug"], {});
const blob = doc.build("Ad" + String.fromCharCode(0x1e87) + "la - onWard portfolio");
const bytes = new Uint8Array(await blob.arrayBuffer());
let high = 0;
for (const b of bytes) if (b > 0x7f) high++;
check("pure-ASCII output", high === 0, bytes.length + " bytes, " + high + " above 0x7F");

const text = new TextDecoder("utf-8").decode(bytes);
const declared = Number((text.match(new RegExp("/Length (\\d+) >>")) || [])[1] ?? -1);
const from = text.indexOf("stream" + String.fromCharCode(10)) + 7;
const body = text.slice(from, text.indexOf("endstream"));
check("stream /Length exact", declared === body.length, declared + " vs " + body.length);
const sx = Number((text.match(new RegExp("startxref" + String.fromCharCode(10) + "(\\d+)")) || [])[1] ?? -1);
check("xref offset lands", text.slice(sx, sx + 4) === "xref", String(sx));
check("octal byte in stream", text.includes(BS + "351"), "looking for " + BS + "351");
check("wrap splits", wrap("word ".repeat(120) + "!", 200, 10).length > 3, wrap("word ".repeat(120) + "!", 200, 10).length);
check("fit ellipsises", fit("Ad" + E_ACUTE + "ola a very long name that will not fit at all", 60, 10).endsWith("..."));

console.log(fail ? String(fail) + " CHECKS FAILED" : "ALL CHECKS PASSED");

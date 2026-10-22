// Read-only discovery: print actual links; never infer an answer from filenames.
const urls = [
  'https://www.upsc.gov.in/hi/examinations/' + encodeURIComponent('केंद्रीय सशस्त्र पुलिस बल (सहायक कमांडेंट) परीक्षा, 2025'),
  'https://www.upsc.gov.in/examinations/National%20Defence%20Academy%20and%20Naval%20Academy%20Examination%20%28I%29%2C%202025',
];
for (const url of urls) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const html = await response.text();
    console.log(JSON.stringify({ url, status: response.status, links: [...html.matchAll(/href=["']([^"']+\.pdf)["']/gi)].map(match => new URL(match[1], url).href).filter(href => /key|ans|gat|general/i.test(href)) }, null, 2));
  } catch (error) { console.log(JSON.stringify({ url, error: error.message })); }
}

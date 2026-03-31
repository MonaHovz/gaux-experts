const https = require('https');

const TOKEN = '';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
}

exports.handler = async (event) => {
  const table = (event.queryStringParameters || {}).table;
  if (!table) return { statusCode: 400, body: 'Missing table name' };

  try {
    let all = [], offset;
    do {
      let url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}?pageSize=100`;
      if (offset) url += `&offset=${offset}`;
      const d = await httpsGet(url);
      if (d.error) return { statusCode: 403, body: JSON.stringify(d) };
      all.push(...(d.records || []));
      offset = d.offset;
    } while (offset);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: all }),
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

const https = require('https');

const DATA_API_KEY = 'al-wRUJzSv245kEVDXTkGxoEwYVp7Rbsm9LcRwWt8ZW0TT';
const CLUSTER = 'cluster010';
const DB_NAME = 'flowersworld';

const dataAPIRequest = async (action, collection, filter = null, document = null) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      dataSource: CLUSTER,
      database: DB_NAME,
      collection: collection,
      ...(filter && { filter }),
      ...(document && { document })
    });

    const options = {
      hostname: 'data.mongodb-api.com',
      path: `/app/data-xyz/endpoint/data/v1/action/${action}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'api-key': DATA_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const connectDB = async () => {
  try {
    await dataAPIRequest('ping');
    console.log('MongoDB (Data API) Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Server will continue without database connection');
  }
};

module.exports = { connectDB, dataAPIRequest };

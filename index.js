const express = require('express')
const axios = require('axios')
const path = require('path')
const PORT = process.env.PORT || 5000
const bodyParser = require('body-parser')
const nodemailer = require("nodemailer");
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.TOKEN 
const testAccount = {
    user: process.env.USERNAME,
    pass: process.env.PASS
}
const app = express();

let transporter = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });


async function processNewLead(leadId) {
  let response;

  try {
      // Get lead details by lead ID from Facebook API
      response = await axios.get(`https://graph.facebook.com/v14.0/${leadId}/?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`);
  }
  catch (err) {
      // Log errors
      return console.warn(`An invalid response was received from the Facebook API:`, err.response.data ? JSON.stringify(err.response.data) : err.response);
  }

  // Ensure valid API response returned
  if (!response.data || (response.data && (response.data.error || !response.data.field_data))) {
      return console.warn(`An invalid response was received from the Facebook API: ${response}`);
  }

  // Lead fields
  const leadForm = [];

  // Extract fields
  for (const field of response.data.field_data) {
      // Get field name & value
      const fieldName = field.name;
      const fieldValue = field.values[0];

      // Store in lead array
      leadForm.push(`${fieldName}: ${fieldValue}`);
  }

  // Implode into string with newlines in between fields
  const leadInfo = leadForm.join('\n');

  // Log to console
  console.log('A new lead was received!\n', leadInfo);
}
// Accept JSON POST body
app.use(bodyParser.json());

// GET /webhook
app.get('/webhook', (req, res) => {
    // Facebook sends a GET request
    // To verify that the webhook is set up
    // properly, by sending a special challenge that
    // we need to echo back if the "verify_token" is as specified
    if (req.query['hub.verify_token'] === 'CUSTOM_WEBHOOK_VERIFY_TOKEN') {
        res.send(req.query['hub.challenge']);
        return;
    }
})

// POST /webhook
app.post('/webhook', async (req, res) => {
    // Facebook will be sending an object called "entry" for "leadgen" webhook event
    if (!req.body.entry) {
        return res.status(500).send({ error: 'Invalid POST data received' });
    }

    // Travere entries & changes and process lead IDs
    for (const entry of req.body.entry) {
        for (const change of entry.changes) {
            // Process new lead (leadgen_id)
            await processNewLead(change.value.leadgen_id);
        }
    }

    // Success
    res.send({ success: true });
})

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT} ${process.env.TOKEN}`)
});

// Process incoming leads
async function processNewLead(leadId) {
    let response;

    try {
        // Get lead details by lead ID from Facebook API
        response = await axios.get(`https://graph.facebook.com/v9.0/${leadId}/?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`);
    }
    catch (err) {
        // Log errors
        return console.warn(`An invalid response was received from the Facebook API:`, err.response.data ? JSON.stringify(err.response.data) : err.response);
    }

    // Ensure valid API response returned
    if (!response.data || (response.data && (response.data.error || !response.data.field_data))) {
        return console.warn(`An invalid response was received from the Facebook API: ${response}`);
    }

    // Lead fields
    const leadForm = [];

    // Extract fields
    for (const field of response.data.field_data) {
        // Get field name & value
        const fieldName = field.name;
        const fieldValue = field.values[0];

        // Store in lead array
        leadForm.push(`${fieldName}: ${fieldValue}`);
    }

    // Implode into string with newlines in between fields
    const leadInfo = leadForm.join('\n');

    // Log to console
    console.log('A new lead was received!\n', leadInfo);

    // Use a library like "nodemailer" to notify you about the new lead
    // 
    // Send plaintext e-mail with nodemailer
    transporter.sendMail({
        from: `Custemers <customers@yourinfostar.com>`,
        to: `kumakaraev01@gmail.com`,
        subject: 'New Lead: ',
        text: new Buffer(leadInfo),
        headers: { 'X-Entity-Ref-ID': 1 }
    }, function (err) {
        if (err) return console.log(err);
        console.log('Message sent successfully.');
    });
}

  
const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");
const { createObjectCsvWriter } = require("csv-writer");
const { log } = require("console");

const INPUT_CSV = "input.csv";
const OUTPUT_CSV = "updated_output.csv";

async function fetchPostalCode(address) {
  try {
    const response = await axios.get("https://geocode.ca", {
      params: {
        locate: address,
        json: 1,
      },
    });

    if (response.data && response.data.postal) {
      return response.data.postal;
    }
  } catch (error) {
    console.error(`Error fetching postal code for ${address}:`, error.message);
  }
  console.log(`was not able to find postal code for address: ${address}`);
  return "";
}

async function processCSV() {
  const records = [];
  fs.createReadStream(INPUT_CSV)
    .pipe(csv())
    .on("data", (row) => records.push(row))
    .on("end", async () => {
      if (records.length === 0) return console.log("No data found in CSV.");

      const headers = Object.keys(records[0]);
      if (!headers.includes("address"))
        return console.error('CSV is missing an "address" field.');
      if (!headers.includes("postal_code")) headers.push("postal_code");

      for (const record of records) {
        if (!record.postal_code || record.postal_code.trim() === "") {
          console.log(`Fetching postal code for: ${record.address}`);
          record.postal_code = await fetchPostalCode(record.address);
        }
      }

      const csvWriter = createObjectCsvWriter({
        path: OUTPUT_CSV,
        header: headers.map((field) => ({ id: field, title: field })),
      });

      await csvWriter.writeRecords(records);
      console.log(`Updated CSV written to ${OUTPUT_CSV}`);
    });
}

processCSV();

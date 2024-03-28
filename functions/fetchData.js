// fetchData.js

const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/charanksri/raagalahari/ae84b9ee1fab94eff38bf2670a9b17ceff35ef45/data.json"
    );
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch data" }),
    };
  }
};

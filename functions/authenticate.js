// functions/authenticate.js

exports.handler = async (event, context) => {
  try {
    const clientId = "737cd1dc8e6a4dee9c73becd0e05eb47";
    const clientSecret = "ea1fb28132544f7fae62b4fc13368eb7";

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate");
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ access_token: data.access_token }),
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to authenticate" }),
    };
  }
};

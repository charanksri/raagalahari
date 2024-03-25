import Dotenv from "dotenv-webpack";

module.exports = {
  // other webpack configuration options...
  plugins: [
    new Dotenv({
      systemvars: true, // Load system environment variables
    }),
  ],
};

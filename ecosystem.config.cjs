
module.exports = {
    apps: [
      {
        name: "easytaxi-Backend",
        script: "nodemon",
        args: "index.js", // replace with your entry point
        interpreter: "none",
        env: {
          PORT: 4000,
          NODE_ENV: "development",
        },
      },
    ],
  };
  
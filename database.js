const postgresUrl =
  "postgresql://retool:Nf6qlw4FRjCi@ep-empty-salad-797560.us-west-2.retooldb.com/retool?sslmode=require";

var createClient = require("@vercel/postgres").createClient;

const getConnectedClient = async () => {
  const client = createClient({
    connectionString: postgresUrl,
  });

  await client.connect();
  return client;
};

module.exports = getConnectedClient;

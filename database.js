const postgresUrl = "postgresql://retool:Nf6qlw4FRjCi@ep-empty-salad-797560.us-west-2.retooldb.com/retool?sslmode=require"

var createClient = require('@vercel/postgres').createClient;
const client = createClient({
  connectionString: postgresUrl
});

let db = null

 const getConnectedClient = async ()=> {
    if(db){
        return db
    }
    await client.connect();

    db = client
    return db
}

module.exports = getConnectedClient
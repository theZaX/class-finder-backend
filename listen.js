const index = require('./index')
const port = 3000

const app = index.app;
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

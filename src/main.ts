import { app } from "./index.js";

const port = 3000;

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
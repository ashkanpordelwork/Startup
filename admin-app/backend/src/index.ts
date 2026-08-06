import "dotenv/config";
import { app } from "./app.js";

const PORT = process.env.PORT ?? 4100;

app.listen(PORT, () => {
  console.log(`Admin backend listening on http://localhost:${PORT}`);
});

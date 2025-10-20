import app from "./app.js";
import process from "process";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server is running...\napi docs: \x1b[36mhttp://localhost:${PORT}/api-docs\x1b[0m`);
});

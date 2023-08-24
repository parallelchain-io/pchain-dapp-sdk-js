import { config } from "dotenv";

before("Setup environment variables", () => {
  config();
});

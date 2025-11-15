import { config } from "dotenv";
config(); // load .env

export default {
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
};

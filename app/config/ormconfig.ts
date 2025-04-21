import { DataSourceOptions } from "typeorm";
import { User } from "../database/model/User.model";
import * as dotenv from "dotenv";

dotenv.config();

let dbPort: number;
if (process.env.DB_PORT) {
  dbPort = parseInt(process.env.DB_PORT, 10); // Parse with radix 10
} else {
  console.warn("DB_PORT environment variable is not set, using default port 5432");
  dbPort = 5432;
}

const ormconfig: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: dbPort,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true, //for dev environment only
  entities: [User],
  // migrations: ["app/migrations/*.ts"],
  // subscribers: [],
  // logging: true,
};

export default ormconfig;
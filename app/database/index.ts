import { DataSource } from "typeorm";
import ormconfig from "../config/ormconfig"; 


let dataSource: DataSource | null = null;

export const getDataSource = async (): Promise<DataSource> => {

  try {
    dataSource = new DataSource(ormconfig);
    await dataSource.initialize();
    return dataSource;
  } catch (error) {
    console.error("Error initializing DataSource:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};
 
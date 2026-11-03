import { customType } from "drizzle-orm/mysql-core";

/** Biner hingga 16 MB (MariaDB/MySQL MEDIUMBLOB); driver mengembalikan Buffer. */
export const mediumBlob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "mediumblob",
});

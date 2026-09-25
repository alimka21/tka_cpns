import { customType } from "drizzle-orm/mysql-core";

/**
 * Kolom JSON yang aman untuk MariaDB. MariaDB menyimpan `json` sebagai
 * LONGTEXT sehingga driver mengembalikan string; tipe ini selalu
 * `JSON.parse` saat membaca (dan tetap bekerja di MySQL yang mengembalikan
 * objek). DDL tetap `json`, jadi tidak ada perubahan migrasi.
 */
export const jsonText = <T>(name: string) =>
  customType<{ data: T; driverData: string }>({
    dataType: () => "json",
    toDriver: (value) => JSON.stringify(value),
    fromDriver: (value) => (typeof value === "string" ? (JSON.parse(value) as T) : (value as T)),
  })(name);

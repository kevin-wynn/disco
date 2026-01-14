// @ts-ignore
import { CreateLoggy } from "@loggydev/loggy-node";

export const loggy = CreateLoggy({
  identifier: "disco",
  remote: {
    endpoint: "http://localhost:3000/logs/ingest",
    token: "f46802a4-9bf6-42f5-ab06-93932eab641f",
  }
});
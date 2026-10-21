import { createServer } from "node:http";
import { createApp } from "../src/app";
import { createSocketServer } from "../src/socket";

const httpServer = createServer(createApp());

createSocketServer(httpServer);

export default httpServer;

import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import fjwt from "@fastify/jwt";
import swagger from "@fastify/swagger";

import { withRefResolver } from "fastify-zod";

import userRoutes from "./models/user/user.route";
import productRoutes from "./models/product/product.route";
import { userSchemas } from "./models/user/user.schema";
import { productSchemas } from "./models/product/product.schema";
import { version } from "../package.json";

export const server = Fastify();

server.register(swagger);
server.register(require("@fastify/swagger-ui"), {
  routePrefix: "/docs",
});

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: any;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      email: string;
      name: string;
      id: number;
    };
  }
}

server.register(fjwt, {
  secret: "secret",
});

server.decorate(
  "authenticate",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (e) {
      return reply.send(e);
    }
  }
);

server.get("/healthcheck", async () => {
  return { status: "ok" };
});

async function main() {
  for (const schema of [...userSchemas, ...productSchemas]) {
    server.addSchema(schema);
  }

  server.register(userRoutes, { prefix: "/api/users" });
  server.register(productRoutes, { prefix: "/api/products" });

  try {
    await server.listen({ port: 3000, host: "127.0.0.1" }, (err, address) => {
      console.log("server listening on", address);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();

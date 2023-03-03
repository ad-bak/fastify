import { FastifyReply, FastifyRequest } from "fastify";
import { createUser, findUserByEmail, findUsers } from "./user.service";
import { CreateUserInput, LoginInput } from "./user.schema";
import { verifyPassword } from "../../utils/hash";
import { server } from "../../app";

export async function registerUserHandler(
  request: FastifyRequest<{
    Body: CreateUserInput;
  }>,
  reply: FastifyReply
) {
  const body = request.body;
  console.log({ body });

  try {
    const user = await createUser(body);
    return reply.code(201).send(user);
  } catch (e) {
    console.log(e);
    return reply.code(500).send(e);
  }
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  const body = request.body;

  //1. check if user exists
  const user = await findUserByEmail(body.email);

  if (!user) {
    return reply.code(401).send({
      message: "User not found",
    });
  }

  //2. check if password is correct
  const correctPassword = verifyPassword({
    candidatePassword: body.password,
    salt: user.salt,
    hash: user.password,
  });

  //3. generate token

  if (correctPassword) {
    const { password, salt, ...rest } = user;

    return { accessToken: server.jwt.sign(rest) };
  }

  return reply.code(401).send({
    message: "Incorrect password",
  });
}

export async function getUsersHandler() {
  const users = await findUsers();

  return users;
}

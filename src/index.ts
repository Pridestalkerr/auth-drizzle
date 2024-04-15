import { auth } from "./auth";

const exampleLogin = async (email: string, password: string) => {
  try {
    const key = await auth.useKey({
      provider: "EMAIL",
      providerUserId: email,
      password,
    });

    const session = await auth.createSession({
      userId: key.userId,
      attributes: {},
      // auto-generated token
      // sessionId: "my-token-here-349873847384738473"
    });

    // set cookie...
    return session.session.id;
  } catch (err) {
    // here you can respond with FORBIDDEN or something
    throw new Error("Invalid login");
  }
};

const exampleLogout = async (token: string) => {
  await auth.invalidateSession(token);
  // reset cookie...
};

const exampleRegister = async (email: string, password: string) => {
  await auth.createUser({
    key: {
      provider: "EMAIL",
      providerUserId: email,
      password,
    },
    attributes: {
      // id is not required since the schema defines it as defaultRandom
      email,
      firstName: "John",
      lastName: "Doe",
    },
  });
};

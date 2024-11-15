import { api } from "@/convex/_generated/api";

export type User =
  | {
      signedIn: true;
      birthday: Date;
      user: NonNullable<(typeof api.myFunctions.getUser)["_returnType"]>;
    }
  | {
      signedIn: false;
      birthday: Date;
    };

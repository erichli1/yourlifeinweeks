import { api } from "@/convex/_generated/api";

export type User =
  | {
      signedIn: true;
      birthday: Date;
      account: NonNullable<(typeof api.myFunctions.getAccount)["_returnType"]>;
    }
  | {
      signedIn: false;
      birthday: Date;
    };

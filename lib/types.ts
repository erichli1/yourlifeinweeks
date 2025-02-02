import { api } from "@/convex/_generated/api";

export type User =
  | {
      signedIn: true;
      birthday: Date;
      account: NonNullable<
        (typeof api.myFunctions.getActiveAccount)["_returnType"]
      >;
    }
  | {
      signedIn: false;
      birthday: Date;
    };

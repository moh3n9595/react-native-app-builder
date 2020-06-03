import build from ".";
import { PlatformInterface } from "./types";

build(process.argv[2] as PlatformInterface, process.argv[3])
  .then(() => {
    // ...
  })
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });

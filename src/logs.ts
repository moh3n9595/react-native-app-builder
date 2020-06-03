import colors from "colors";
import boxen from "boxen";
import {
  name as packageName,
  version as packageVersion,
  description as packageDescription,
} from "../package.json";

export const logLine = colors.gray("\n---------------------------------");

// Package info log :
export function packageInfoLog(): void {
  console.log(
    "\n" +
      boxen(
        packageName + " v" + packageVersion + "\n\n " + packageDescription,
        { padding: 1, borderColor: "yellow" }
      )
  );
}

export function beautyLog(message: string, type = "warn"): void {
  switch (type) {
    case "warn":
      console.log("\n   " + colors.bold(colors.yellow("warn")) + " " + message);
      break;
    case "info":
      console.log("\n   " + colors.bold(colors.cyan("info")) + " " + message);
      break;
    case "success":
      console.log(
        "\n   " + colors.bold(colors.green("success")) + " " + message
      );
      break;
    default:
      console.log("\n   " + message);
      break;
  }
}

// read error better :
export function beautyErrorLog(err: string | Error): void {
  let errMessage = "";
  if (typeof err != "string") {
    errMessage = err.message;
  } else {
    errMessage = err;
  }
  console.log(
    "\n   " +
      colors.bold(colors.red("error")) +
      " " +
      errMessage.replace(/\n/g, "\n   ") +
      "\n"
  );
}

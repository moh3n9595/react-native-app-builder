import colors from "colors";
import boxen from "boxen";
import logUpdate from "log-update";
import {
  name as packageName,
  version as packageVersion,
  description as packageDescription,
} from "../../package.json";

let loadingLogInterval: NodeJS.Timeout;
let loadingLogTxt: string | boolean;

function loadingLog(txt: string): void {
  loadingLogTxt = txt;
  const frames = ["", ".", "..", "..."];
  let i = 0;

  loadingLogInterval = setInterval(() => {
    const frame = frames[(i = ++i % frames.length)];
    logUpdate(txt + `${frame}`);
  }, 1000);
}

function clearLoadingLog(): void {
  clearInterval(loadingLogInterval);
  logUpdate.clear();
  logUpdate.done();
}

export const logLine = (): void =>
  log(colors.gray("\n---------------------------------"));

// Package info log :
export function packageInfoLog(): void {
  log(
    "\n" +
      boxen(
        packageName + " v" + packageVersion + "\n\n " + packageDescription,
        { padding: 1, borderColor: "yellow" }
      )
  );
}

export interface BeautyLogOptionsInterface {
  boldedTxt?: string;
  loadingLog?: boolean;
}

export function beautyLog(
  message: string,
  type = "warn",
  options = {
    boldedTxt: "",
    loadingLog: false,
  } as BeautyLogOptionsInterface
): void {
  message = message.replace(
    options.boldedTxt!,
    colors.bold(options.boldedTxt!)
  );
  let logTxt = "";
  switch (type) {
    case "warn":
      logTxt = "\n   " + colors.bold(colors.yellow("warn")) + " " + message;
      break;
    case "info":
      logTxt = "\n   " + colors.bold(colors.cyan("info")) + " " + message;
      break;
    case "success":
      logTxt = "\n   " + colors.bold(colors.green("success")) + " " + message;
      break;
    default:
      logTxt = "\n   " + message;
      break;
  }

  if (options.loadingLog) loadingLog(logTxt);
  else log(logTxt);
}

// read error better :
export function beautyErrorLog(err: string | Error, justReturn = false): void {
  let errMessage = "";
  if (typeof err != "string") {
    errMessage = err.message;
  } else {
    errMessage = err;
  }
  return log(
    "\n   " +
      colors.bold(colors.red("error")) +
      " " +
      errMessage.replace(/\n/g, "\n   ") +
      "\n",
    justReturn
  );
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function log(param?: any, justReturn = false): void {
  clearLoadingLog();

  if (loadingLogTxt) {
    console.log(loadingLogTxt);
    loadingLogTxt = false;
  }

  if (!justReturn) console.log(param);
  return param;
}

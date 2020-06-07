import path from "path";
import {
  PlatformSpecificInterface,
  SettingsFileAndroidParamsInterface,
  SettingsFileIOSParamsInterface,
  PlatformInterface,
  SettingsFileIOSInterface,
  SettingsFileAndroidInterface,
  SettingsFileInterface,
  SettingsFileAndroidBothInterface,
  SettingsFileIOSBothInterface,
  isSettingsFileIOSBothInterface,
} from "../types";
import { beautyErrorLog } from "../Logs";
import fs from "fs-extra";

// Operating system detection :
export function osDetection(): "Linux" | "Windows" | "MacOS" {
  const opsys = process.platform;
  switch (opsys) {
    case "darwin":
      return "MacOS";
    //@ts-ignore:
    case "win64":
    case "win32":
      return "Windows";
    case "linux":
      return "Linux";
    default:
      return "Linux";
  }
}

// Value generator :
export function* valueGenFunc(
  storesArr: Array<
    SettingsFileAndroidParamsInterface | SettingsFileIOSParamsInterface
  >
): Generator<
  SettingsFileAndroidParamsInterface | SettingsFileIOSParamsInterface,
  any,
  unknown
> {
  for (let i = 0; i < storesArr.length; i++) {
    yield storesArr[i];
  }
}

export function buildPathResolver(platform: PlatformSpecificInterface): string {
  return path.join(".", `/builds/${platform}`);
}

// Create obj for builders :
export function buildObjectResolver(
  mainObj: SettingsFileInterface,
  platform: PlatformSpecificInterface,
  reject: (reason?: any) => void
): SettingsFileAndroidInterface | SettingsFileIOSInterface | undefined {
  if (platform === "ios" && !isSettingsFileIOSBothInterface(mainObj)) {
    beautyErrorLog("platform conflicts with settingObject");
    reject(new Error("platform conflicts with settingObject"));
  } else
    switch (platform) {
      case "android":
        // eslint-disable-next-line no-case-declarations
        const androidMainObj = mainObj as SettingsFileAndroidBothInterface;
        return {
          projectBase: androidMainObj.projectBase,
          settingFilePath: androidMainObj.settingFilePath,
        };
      case "ios":
        // eslint-disable-next-line no-case-declarations
        const iosMainObj = mainObj as SettingsFileIOSBothInterface;
        return {
          projectBase: iosMainObj.projectBase,
          settingFilePath: iosMainObj.settingFilePath,
          workspacePath: iosMainObj.workspacePath,
          schemePath: iosMainObj.schemePath,
        };
    }
}

// Validate and create platform parameters :
export function settingFileParameters(
  platform: PlatformInterface,
  mainObj: SettingsFileInterface,
  reject: (reason?: any) => void
): [
  null | Generator<SettingsFileAndroidParamsInterface, any, unknown>,
  null | Generator<SettingsFileIOSParamsInterface, any, unknown>
] {
  const finalArr = [];

  if (platform == "android" || platform == "both") {
    const androidMainObj = mainObj as SettingsFileAndroidBothInterface;
    if (androidMainObj.androidParams)
      finalArr.push(
        valueGenFunc(androidMainObj.androidParams) as Generator<
          SettingsFileAndroidParamsInterface,
          any,
          unknown
        >
      );
    else {
      beautyErrorLog("androidParams is undefined!");
      reject(new Error("androidParams is undefined!"));
    }
  } else {
    finalArr.push(null);
  }
  if (platform == "ios" || platform == "both") {
    const iosMainObj = mainObj as SettingsFileIOSBothInterface;
    if (iosMainObj.iosParams)
      finalArr.push(
        valueGenFunc(iosMainObj.iosParams) as Generator<
          SettingsFileIOSParamsInterface,
          any,
          unknown
        >
      );
    else {
      beautyErrorLog("iosParams is undefined!");
      reject(new Error("iosParams is undefined!"));
    }
  } else {
    finalArr.push(null);
  }

  //@ts-ignore
  return finalArr;
}

// Initialize settings :
export function initializeSettingFile(
  platform: PlatformInterface,
  address: string,
  reject: (reason?: any) => void
): undefined | SettingsFileInterface {
  let settings = "";

  try {
    settings = fs.readFileSync(address).toString();

    let parsedSettings;
    switch (platform) {
      case "android":
        parsedSettings = JSON.parse(settings) as SettingsFileAndroidInterface;
        break;
      case "ios":
        parsedSettings = JSON.parse(settings) as SettingsFileIOSInterface;
        break;
      case "both":
        parsedSettings = JSON.parse(settings) as SettingsFileAndroidInterface &
          SettingsFileIOSInterface;
        break;
    }

    if (!settings) {
      beautyErrorLog("invalid setting file!");
      if (reject) reject(new Error("invalid setting file!"));
    }
    return parsedSettings;
  } catch (e) {
    beautyErrorLog(e);
    if (reject) reject(e);
  }
}

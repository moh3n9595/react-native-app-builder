import fs from "fs-extra";
import path from "path";
import { exec, execSync } from "child_process";

import { PlatformInterface } from "./types/PlatformInterface";
import { logLine, beautyLog, packageInfoLog, beautyErrorLog } from "./Logs";
import { MAX_BUFFER_SIZE, ARCHIVE_NAME } from "./constants";

import {
  osDetection,
  buildPathResolver,
  buildObjectResolver,
  settingFileParameters,
  initializeSettingFile,
} from "./Utils";

import {
  SettingsFileAndroidParamsInterface,
  SettingsFileIOSParamsInterface,
  SettingsFileIOSInterface,
  SettingsFileAndroidInterface,
  SettingsFileInterface,
} from "./types";

// Builds for android :
function buildAndroid(
  androidValueGen: Generator<SettingsFileAndroidParamsInterface, any, unknown>,
  { projectBase, settingFilePath }: SettingsFileAndroidInterface,
  resolve: (value?: any) => void,
  reject: (reason?: any) => void
) {
  const androidBuildPath =
    "/android/app/build/outputs/apk/release/app-release.apk";
  const { value: newValues, done } = androidValueGen.next();
  const OS = osDetection();

  if (!newValues) {
    logLine();
    return resolve();
  }

  if (!newValues.buildName) {
    beautyErrorLog(
      "buildName key is undefined | emptyString | null | false -- (Required)"
    );
    return reject(
      new Error(
        "buildName key is undefined | emptyString | null | false -- (Required)"
      )
    );
  }

  logLine();
  beautyLog("building " + newValues.buildName, "info", {
    boldedTxt: newValues.buildName,
    loadingLog: true,
  });

  // Set variable :
  try {
    let settingJson = require(path.join(projectBase, settingFilePath));
    settingJson = { ...settingJson, ...newValues, buildName: undefined };
    fs.writeFileSync(
      path.join(projectBase, settingFilePath),
      JSON.stringify(settingJson)
    );

    if (OS == "Windows") execSync(projectBase.split(":")[0] + ":");

    exec(
      `cd ${projectBase}/android && ${
        OS != "Windows" ? "./" : ""
      }gradlew assembleRelease`,
      { maxBuffer: MAX_BUFFER_SIZE },
      (error, stdout) => {
        if (error) {
          beautyErrorLog(error);
          return reject(error);
        }

        if (stdout.includes("BUILD SUCCESSFUL")) {
          beautyLog(newValues.buildName + " finished", "success", {
            boldedTxt: newValues.buildName,
          });

          const newPath = path.join(
            ".",
            `/builds/android/${newValues.buildName}.apk`
          );
          if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
          }
          fs.renameSync(path.join(projectBase, androidBuildPath), newPath);
        }

        if (!done) {
          buildAndroid(
            androidValueGen,
            { projectBase, settingFilePath },
            resolve,
            reject
          );
        }
      }
    );
  } catch (e) {
    beautyErrorLog(e);
    return reject(e);
  }
}

// Builds for ios :
function buildIOS(
  iosValueGen: Generator<SettingsFileIOSParamsInterface, any, unknown>,
  {
    projectBase,
    settingFilePath,
    workspacePath,
    schemePath,
  }: SettingsFileIOSInterface,
  resolve: (value?: any) => void,
  reject: (reason?: any) => void
) {
  if (osDetection() != "MacOS") {
    beautyLog("ios need mac operating system!", "warn");
    resolve(true);
  }

  const iosBuildPath = `/ios/${ARCHIVE_NAME}.xcarchive`;
  const { value: newValues, done } = iosValueGen.next();
  if (!newValues) {
    logLine();
    return resolve();
  }

  if (!newValues.buildName) {
    beautyErrorLog(
      "buildName key is undefined | emptyString | null | false -- (Required)"
    );
    return reject(
      new Error(
        "buildName key is undefined | emptyString | null | false -- (Required)"
      )
    );
  }

  logLine();
  beautyLog("building " + newValues.buildName, "info", {
    boldedTxt: newValues.buildName,
    loadingLog: true,
  });

  // Set variable :
  try {
    let settingJson = require(path.join(projectBase, settingFilePath));
    settingJson = { ...settingJson, ...newValues, buildName: undefined };
    fs.writeFileSync(
      path.join(projectBase, settingFilePath),
      JSON.stringify(settingJson)
    );

    exec(
      // eslint-disable-next-line no-useless-escape
      `cd ${projectBase}/ios && xcodebuild -allowProvisioningUpdates -workspace ${workspacePath}.xcworkspace -scheme \"${schemePath}\" clean archive -configuration release -sdk iphoneos -archivePath ${ARCHIVE_NAME}.xcarchive`,
      { maxBuffer: MAX_BUFFER_SIZE },
      (error, stdout) => {
        if (error) {
          beautyErrorLog(error);
          return reject(error);
        }

        if (stdout.includes("ARCHIVE SUCCEEDED")) {
          beautyLog(newValues.buildName + " finished", "success", {
            boldedTxt: newValues.buildName,
          });
          const newPath = path.join(
            ".",
            `/builds/ios/${newValues.buildName}.xcarchive`
          );
          if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
          }
          fs.renameSync(path.join(projectBase, iosBuildPath), newPath);
        }

        if (!done) {
          buildIOS(
            iosValueGen,
            { projectBase, settingFilePath, workspacePath, schemePath },
            resolve,
            reject
          );
        }
      }
    );
  } catch (e) {
    beautyErrorLog(e);
    return reject(e);
  }
}

// Main :
export default function main(
  platform: PlatformInterface,
  settingFilePath: string | SettingsFileInterface
): Promise<any> {
  packageInfoLog();

  return new Promise((resolve, reject) => {
    if (!settingFilePath) {
      beautyErrorLog("invalid setting file address!");
      reject(new Error("invalid setting file address!"));
    }

    let parsedSettingFile: SettingsFileInterface;
    if (typeof settingFilePath === "string")
      parsedSettingFile = initializeSettingFile(
        platform,
        settingFilePath,
        reject
      )!;
    else parsedSettingFile = settingFilePath;

    const [androidValueGen, iosValueGen] = settingFileParameters(
      platform,
      parsedSettingFile,
      reject
    );

    switch (platform) {
      case "android":
        fs.mkdirSync(buildPathResolver("android"), {
          recursive: true,
        });
        buildAndroid(
          androidValueGen!,
          buildObjectResolver(parsedSettingFile, "android", reject)!,
          resolve,
          reject
        );
        break;
      case "ios":
        if (osDetection() != "MacOS") {
          beautyErrorLog("ios need mac operating system!");
          return reject(new Error("ios need mac operating system!"));
        }
        fs.mkdirSync(buildPathResolver("ios"), {
          recursive: true,
        });
        buildIOS(
          iosValueGen!,
          buildObjectResolver(
            parsedSettingFile,
            "ios",
            reject
          ) as SettingsFileIOSInterface,
          resolve,
          reject
        );
        break;
      case "both":
        fs.mkdirSync(buildPathResolver("android"), {
          recursive: true,
        });
        buildAndroid(
          androidValueGen!,
          buildObjectResolver(parsedSettingFile, "android", reject)!,
          () => {
            if (osDetection() != "MacOS") {
              beautyErrorLog("ios need mac operating system!");
              return reject(new Error("ios need mac operating system!"));
            }
            fs.mkdirSync(buildPathResolver("ios"), {
              recursive: true,
            });
            buildIOS(
              iosValueGen!,
              buildObjectResolver(
                parsedSettingFile,
                "ios",
                reject
              ) as SettingsFileIOSInterface,
              resolve,
              reject
            );
          },
          reject
        );
        break;
    }
  });
}

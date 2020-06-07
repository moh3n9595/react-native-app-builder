/* eslint-disable @typescript-eslint/no-empty-function */
import * as Utils from ".";
import "jest-matcher-one-of";
import path from "path";
import {
  PlatformSpecificInterface,
  PlatformInterface,
  isSettingsFileIOSInterface,
  SettingsFileInterface,
  SettingsFileAndroidBothInterface,
  SettingsFileIOSBothInterface,
} from "../types";
import { beautyErrorLog } from "../Logs";
import fs from "fs-extra";

jest.mock("fs");
const spy = jest.spyOn(console, "log").mockImplementation();

it("function osDetection()", () => {
  const defaultPlatform = "Linux";
  const platforms = [
    { platform: "linux", os: "Linux" },
    { platform: "darwin", os: "MacOS" },
    { platform: "win32", os: "Windows" },
    { platform: "win64", os: "Windows" },
    { platform: "android", os: "" },
  ];

  platforms.forEach(({ platform, os }) => {
    Object.defineProperty(process, "platform", {
      value: platform,
    });
    expect(Utils.osDetection()).toMatch(!os ? defaultPlatform : os);
  });
});

it("function* valueGenFunc(storesArr)", () => {
  const generation = [
    { buildName: "foo" },
    { buildName: "bar" },
    { buildName: "baz" },
  ];
  const generator = Utils.valueGenFunc(generation);

  generation.forEach((generationElem) => {
    const generated = generator.next();
    expect(generated.value).toMatchObject(generationElem);
  });
});

it("function buildPathResolver(platform)", () => {
  const platforms: Array<PlatformSpecificInterface> = ["ios", "android"];

  platforms.forEach((platform) => {
    expect(Utils.buildPathResolver(platform)).toMatch(
      path.join(".", `/builds/${platform}`)
    );
  });
});

it("function buildObjectResolver(mainObj, platform)", () => {
  const mainObjs = [
    {
      projectBase: "projectBase",
      settingFilePath: "settingFilePath",
      workspacePath: "workspacePath",
      schemePath: "schemePath",

      androidParams: [{ buildName: "buildName", storeName: "storeName" }],
      iosParams: [{ buildName: "buildName", storeName: "storeName" }],
    },
    {
      projectBase: "projectBase",
      settingFilePath: "settingFilePath",

      androidParams: [{ buildName: "buildName", storeName: "storeName" }],
    },
    {
      projectBase: "projectBase",
      settingFilePath: "settingFilePath",
      workspacePath: "workspacePath",
      schemePath: "schemePath",

      iosParams: [{ buildName: "buildName", storeName: "storeName" }],
    },
  ];
  mainObjs.forEach((mainObj) => {
    const platforms: Array<PlatformSpecificInterface> = ["android", "ios"];

    platforms.forEach((platform) => {
      if (platform !== "ios" || isSettingsFileIOSInterface(mainObj)) {
        expect(
          Utils.buildObjectResolver(mainObj, platform, () => {})
        ).toMatchObject(
          platform === "android"
            ? {
                projectBase: "projectBase",
                settingFilePath: "settingFilePath",
              }
            : {
                projectBase: "projectBase",
                settingFilePath: "settingFilePath",
                workspacePath: "workspacePath",
                schemePath: "schemePath",
              }
        );
      } else {
        Utils.buildObjectResolver(mainObj, platform, () => {});
        expect(spy).toHaveBeenLastCalledWith(
          beautyErrorLog("platform conflicts with settingObject", true)
        );
      }
    });
  });
});

it("function initializeSettingFile(platform, address, reject)", () => {
  const platforms: Array<PlatformInterface> = ["android", "ios", "both"];

  platforms.forEach((platform) => {
    //@ts-ignore
    fs.readFileSync.mockReturnValue(undefined);
    Utils.initializeSettingFile(platform, "someSettingAddress", () => {});
    expect(spy).toHaveBeenLastCalledWith(
      beautyErrorLog("Cannot read property 'toString' of undefined", true)
    );

    //@ts-ignore
    fs.readFileSync.mockReturnValue(JSON.stringify({ test: "test" }));
    Utils.initializeSettingFile(platform, "someSettingAddress", () => {});
    expect(spy).toHaveBeenLastCalledWith(
      beautyErrorLog("invalid setting file!", true)
    );

    const mainObj = {
      projectBase: "projectBase",
      settingFilePath: "settingFilePath",
      workspacePath: "workspacePath",
      schemePath: "schemePath",

      androidParams: [{ buildName: "buildName", storeName: "storeName" }],
      iosParams: [{ buildName: "buildName", storeName: "storeName" }],
    };
    //@ts-ignore
    fs.readFileSync.mockReturnValue(JSON.stringify(mainObj));
    expect(
      Utils.initializeSettingFile(platform, "someSettingAddress", () => {})
    ).toMatchObject(mainObj);
  });
});

it("function settingFileParameters(platform, mainObj, reject)", () => {
  const platforms: Array<PlatformInterface> = ["android", "ios", "both"];
  const mainObjs: Array<SettingsFileInterface> = [
    {
      projectBase: "projectBase",
      settingFilePath: "settingFilePath",
      workspacePath: "workspacePath",
      schemePath: "schemePath",

      androidParams: [{ buildName: "buildName", storeName: "storeName" }],
      iosParams: [{ buildName: "buildName", storeName: "storeName" }],
    },
    {
      projectBase: "projectBase",
      settingFilePath: "settingFilePath",

      androidParams: [{ buildName: "buildName", storeName: "storeName" }],
    },
    {
      projectBase: "projectBase",
      settingFilePath: "settingFilePath",
      workspacePath: "workspacePath",
      schemePath: "schemePath",

      iosParams: [{ buildName: "buildName", storeName: "storeName" }],
    },
  ];

  mainObjs.forEach((mainObj) => {
    platforms.forEach((platform) => {
      if (platform === "both") {
        if (!(mainObj as SettingsFileAndroidBothInterface).androidParams) {
          Utils.settingFileParameters(platform, mainObj, () => {});
          expect(spy).toHaveBeenLastCalledWith(
            beautyErrorLog("androidParams is undefined!", true)
          );
        } else if (!(mainObj as SettingsFileIOSBothInterface).iosParams) {
          Utils.settingFileParameters(platform, mainObj, () => {});
          expect(spy).toHaveBeenLastCalledWith(
            beautyErrorLog("iosParams is undefined!", true)
          );
        } else
          expect(
            Utils.settingFileParameters(platform, mainObj, () => {})
          ).toEqual([
            Utils.valueGenFunc(
              (mainObj as SettingsFileAndroidBothInterface).androidParams!
            ),
            Utils.valueGenFunc(
              (mainObj as SettingsFileIOSBothInterface).iosParams!
            ),
          ]);
      }

      if (platform === "android") {
        if (!(mainObj as SettingsFileAndroidBothInterface).androidParams) {
          Utils.settingFileParameters(platform, mainObj, () => {});
          expect(spy).toHaveBeenLastCalledWith(
            beautyErrorLog("androidParams is undefined!", true)
          );
        } else
          expect(
            Utils.settingFileParameters(platform, mainObj, () => {})
          ).toEqual([
            Utils.valueGenFunc(
              (mainObj as SettingsFileAndroidBothInterface).androidParams!
            ),
            null,
          ]);
      }

      if (platform === "ios") {
        if (!(mainObj as SettingsFileIOSBothInterface).iosParams) {
          Utils.settingFileParameters(platform, mainObj, () => {});
          expect(spy).toHaveBeenLastCalledWith(
            beautyErrorLog("iosParams is undefined!", true)
          );
        } else
          expect(
            Utils.settingFileParameters(platform, mainObj, () => {})
          ).toEqual([
            null,
            Utils.valueGenFunc(
              (mainObj as SettingsFileIOSBothInterface).iosParams!
            ),
          ]);
      }
    });
  });
});

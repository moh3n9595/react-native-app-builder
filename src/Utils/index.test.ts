/* eslint-disable @typescript-eslint/no-empty-function */
import * as Utils from ".";
import "jest-matcher-one-of";
import path from "path";
import {
  PlatformSpecificInterface,
  PlatformInterface,
  isSettingsFileIOSBothInterface,
} from "../types";
import { beautyErrorLog } from "../Logs";
import fs from "fs-extra";

jest.mock("fs");
const spy = jest.spyOn(console, "log").mockImplementation();

test("function osDetection()", () => {
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
      if (platform !== "ios" || isSettingsFileIOSBothInterface(mainObj)) {
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
          beautyErrorLog("platform conflicts with settingObject")
        );
      }
    });
  });
});

it("function initializeSettingFile(platform, address, reject)", () => {
  const platforms: Array<PlatformInterface> = ["android", "ios", "both"];

  platforms.forEach((platform) => {
    //@ts-ignore
    fs.readFileSync.mockReturnValue(false);
    Utils.initializeSettingFile(platform, "someSettingAddress", () => {});
    expect(spy).toHaveBeenLastCalledWith(
      beautyErrorLog("invalid setting file!")
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

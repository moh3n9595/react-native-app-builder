export interface SettingsFileAndroidParamsInterface {
  buildName: string;
  [x: string]: unknown;
}

export interface SettingsFileIOSParamsInterface {
  buildName: string;
  [x: string]: any;
}

export interface SettingsFileIOSInterface {
  projectBase: string;
  settingFilePath: string;
  workspacePath: string;
  schemePath: string;

  iosParams?: Array<SettingsFileIOSParamsInterface>;
}

export interface SettingsFileAndroidInterface {
  projectBase: string;
  settingFilePath: string;

  androidParams?: Array<SettingsFileAndroidParamsInterface>;
}

export type SettingsFileInterface =
  | SettingsFileAndroidInterface
  | SettingsFileIOSInterface
  | (SettingsFileAndroidInterface & SettingsFileIOSInterface);

export type SettingsFileAndroidBothInterface =
  | SettingsFileAndroidInterface
  | (SettingsFileAndroidInterface & SettingsFileIOSInterface);

export type SettingsFileIOSBothInterface =
  | SettingsFileIOSInterface
  | (SettingsFileAndroidInterface & SettingsFileIOSInterface);

export const isSettingsFileIOSBothInterface = (
  x: SettingsFileInterface
): x is SettingsFileInterface =>
  (x as SettingsFileIOSBothInterface).schemePath !== undefined;

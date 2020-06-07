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

export const isSettingsFileIOSInterface = (
  x: SettingsFileInterface
): x is SettingsFileInterface =>
  (x as SettingsFileIOSInterface).projectBase !== undefined &&
  (x as SettingsFileIOSInterface).settingFilePath !== undefined &&
  (x as SettingsFileIOSInterface).schemePath !== undefined &&
  (x as SettingsFileIOSInterface).workspacePath !== undefined;

export const isSettingsFileAndroidInterface = (
  x: SettingsFileInterface
): x is SettingsFileInterface =>
  (x as SettingsFileIOSInterface).projectBase !== undefined &&
  (x as SettingsFileIOSInterface).settingFilePath !== undefined;

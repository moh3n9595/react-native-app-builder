
declare namespace RNBuilder {
    type Platform = "both" | "android" | "ios";
}

declare function RNBuilder(platform: RNBuilder.Platform, settingFile: string): Promise<any>;

export = RNBuilder;
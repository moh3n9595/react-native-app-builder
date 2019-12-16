# react-native-app-builder &middot; [![Circle CI](https://circleci.com/gh/moh3n9595/react-native-app-builder/tree/master.svg?style=shield)](https://circleci.com/gh/moh3n9595/react-native-app-builder) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/moh3n9595/react-native-app-builder/blob/master/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)](https://github.com/moh3n9595/react-native-app-builder/compare)
Multiple builds for [React Native](https://github.com/facebook/react-native) with different params 



The package is in node, **not react native**!

## Advantages

<p align="center">
    <img src="./images/AB-test.jpg">
  <br>
  <p align="center">
    Parameterized Build
  </p>

  <p align="center">
    Build multi-configuration project
  </p>
</p>

## Installation

```
npm install @moh3n95/react-native-app-builder
```

> ⚠️ **NOTE:** you can [download](https://github.com/moh3n9595/react-native-app-builder/releases) latest bundle&nbsp;  ` macOS | Windows | Linux `

## Usage

- Create a json file and set params
  
    ```
    {
        "projectBase": "<PROJECT_PATH>",
        "settingFilePath": "<YOUR_JSON_SETTING_IN_REACT_NATIVE_PROJECT>", 
        "workspacePath": "<YOUR_IOS_WORKSPACE>",
        "schemePath": "<YOUR_IOS_SCHEME>",

        "androidParams": [
            {"buildName":"<YOUR_BUILD_NAME>", "<CUSTOM_PARAM>": "<CUSTOM_VALUE>"},
            ...
        ],
        "iosParams": [
            {"buildName":"<YOUR_BUILD_NAME>", "<CUSTOM_PARAM>": "<CUSTOM_VALUE>"},
            ...
        ]
    }
    ```
    >  See examples [here](#setting-file-example)
- Call function or exec bundle

    ```
    // import
    const RNBuilder = require("@moh3n95/react-native-app-builder");

    RNBuilder(<PLATFORM>, <SETTING_FILE_PATH_OR_DIRECTLY_OBJ>).then(()=>{
        // Build was successful
    })
    .catch(e=>{
        // Raised error
    });
    ```

    > ⚠️ **NOTE:** execute bundle with command line arguments --> `<EXEC_FILE> <PLATFORM> <SETTING_FILE_PATH>`

- Expected output
    ```
    ---------------------------------

    info BUILDING A...

    success A FINISHED

    ---------------------------------

    info BUILDING B...

    success B FINISHED

    ---------------------------------
    ```


## Arguments

- Platform

    |  Value  |    Type    |
    | ------- | ---------- |
    |   ios   |  `string`  |
    | android |  `string`  |
    | both    |  `string`  |


- Setting file path

    |    OS    |    Type    | FileType |                     Sample                      |
    | -------- | ---------- | -------- | ----------------------------------------------- |
    | macOS    |  `string`  | `Json`   |  `/User/<YOUR_USER_NAME>/.../<FILE_NAME>.json`  |
    | Windows  |  `string`  | `Json`   |  `<YOUR_DRIVE_NAME>://.../<FILE_NAME>.json`     |


## Setting file example
- MacOS
    ```
    {
        "projectBase": "/Users/<YOUR_OS_USERNAME>/.../<RN_PROJECT_NAME>", // e.g. : /Users/apple/Desktop/test
        "settingFilePath": "<YOUR_JSON_SETTING_IN_REACT_NATIVE_PROJECT>", // e.g. : ./app.json
        "workspacePath": "<YOUR_IOS_WORKSPACE>", // e.g. : ./test
        "schemePath": "<YOUR_IOS_SCHEME>", // e.g. : test 

        ...
    }
    ```

- Windows
    ```
    {
        "projectBase": "<YOUR_DRIVE_NAME>://.../<RN_PROJECT_NAME>", // e.g. : C://test
        "settingFilePath": "<YOUR_JSON_SETTING_IN_REACT_NATIVE_PROJECT>", // e.g. : ./app.json

        ...
    }
    ```

## Contributing

Thank you for your interest in contributing! Please feel free to put up a PR for any issue or feature request.

## License

[MIT License](https://github.com/moh3n9595/react-native-app-builder/blob/master/LICENSE) © Mohsen Madani 2019

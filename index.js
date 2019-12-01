const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const colors = require("colors");

const logLine = "\n---------------------------------\n";
const MAX_BUFFER_SIZE = 1024 * 500 * 1024;
const ARCHIVE_NAME = "REACT_NATIVE_APP_BUILDER_ARCHIVE"; 
const buildPathResolver = (platform) => path.join(".", `/builds/${platform}`);


// Operating system detection :
function osDetection() {
    const opsys = process.platform;
    switch(opsys) {
        case "darwin":
            return "MacOS";
        case "win32":
        case "win64":
            return "Windows";
        case "linux":
            return "Linux";
        default:
            return "Linux";
    }
}

// Initialize settings :
function initialize(address, callback) {
    let settings = "";
    try {
        settings = fs.readFileSync(address);
        settings = JSON.parse(settings);
        if(!settings) {
            console.log("\n   " + colors.bold(colors.red("error")) + " " + "invalid setting file!" + "\n");
            process.exit();
        }
        return settings;
    }
    catch(e) {
        console.log(e)
        if(callback)
            callback(e);
    }
}

// Value generator :
function* valueGenFunc(storesArr) {
    for (let i = 0; i < storesArr.length; i++) {
        yield storesArr[i];
    }
}


// Builds for android :
function buildAndroid(androidValueGen, projectBase, settingFilePath, resolve, reject) {
    const androidBuildPath = "/android/app/build/outputs/apk/release/app-release.apk";
    const {value:newValues, done} = androidValueGen.next();
    
    if(!newValues) {
        console.log(logLine);
        return resolve();
    }

    if(!Boolean(newValues.buildName)) {
        console.log("\n   " + colors.bold(colors.red("error")) + " " + "buildName key is undefined | emptyString | null | false -- (Required)" + "\n");
        return reject(new Error("buildName key is undefined | emptyString | null | false -- (Required)"));
    }

    console.log(logLine);
    console.log("   " + colors.bold(colors.cyan("info")) + " BUILDING " + newValues.buildName + "...");

    // Set variable : 
    try {
        let settingJson = require(path.join(projectBase,settingFilePath));
        settingJson = { ...newValues, buildName: undefined,  ...settingJson };
        fs.writeFileSync(path.join(projectBase,settingFilePath), JSON.stringify(settingJson));

        exec(`cd ${projectBase}/android && ./gradlew assembleRelease`, {maxBuffer: MAX_BUFFER_SIZE}, (error, stdout, stderr)=> {
            
            if(error) {
                console.log(error);
                return reject(error);
            }

            if(stdout.includes("BUILD SUCCESSFUL")) {
                console.log("\n   " + colors.bold(colors.green("success")) + " " + newValues.buildName + " FINISHED");
                const newPath = path.join(".",`/builds/android/${newValues.buildName}.apk`);
                fs.unlink(newPath, function (err) {
                    if (err) {
                        console.log(error);
                        return reject(error);
                    }
                    fs.renameSync(path.join(projectBase,androidBuildPath), newPath);
                });  
                
            }
    
            if(!done) {
                buildAndroid(androidValueGen, projectBase, settingFilePath, resolve, reject);
            }
                
        });
        
    }
    catch(e) {
        console.log("   " + colors.red(e.message)+ "\n");
        return reject(e);
    } 
}

// Builds for ios :
function buildIOS(iosValueGen, projectBase, settingFilePath, workspacePath, schemePath, resolve, reject) {
    const iosBuildPath = `/ios/${ARCHIVE_NAME}.xcarchive`;
    const {value:newValues, done} = iosValueGen.next();
    
    if(!newValues) {
        console.log(logLine);
        return resolve();
    }

    if(!Boolean(newValues.buildName)) {
        console.log("\n   " + colors.bold(colors.red("error")) + " " + "buildName key is undefined | emptyString | null | false -- (Required)" + "\n");
        return reject(new Error("buildName key is undefined | emptyString | null | false -- (Required)"));
    }

    console.log(logLine);
    console.log("   " + colors.bold(colors.cyan("info")) + " BUILDING " + newValues.buildName + "...");

    // Set variable : 
    try {
        let settingJson = require(path.join(projectBase,settingFilePath));
        settingJson = { ...newValues, buildName: undefined,  ...settingJson };
        fs.writeFileSync(path.join(projectBase,settingFilePath), JSON.stringify(settingJson));

        exec(`cd ${projectBase}/ios && xcodebuild -allowProvisioningUpdates -workspace ${workspacePath}.xcworkspace -scheme \"${schemePath}\" clean archive -configuration release -sdk iphoneos -archivePath ${ARCHIVE_NAME}.xcarchive`, {maxBuffer: MAX_BUFFER_SIZE}, (error, stdout, stderr)=> {
            
            if(error) {
                console.log(error);
                return reject(error);
            }

            if(stdout.includes("ARCHIVE SUCCEEDED")) {
                console.log("\n   " + colors.bold(colors.green("success")) + " " + newValues.buildName + " FINISHED");
                const newPath = path.join(".",`/builds/ios/${newValues.buildName}.xcarchive`);
                fs.unlink(newPath, function (err) {
                    if (err) {
                        console.log(error);
                        return reject(error);
                    }
                    fs.renameSync(path.join(projectBase,iosBuildPath), newPath);
                });  
                
            }
    
            if(!done) {
                buildIOS(iosValueGen, projectBase, settingFilePath, workspacePath, schemePath, resolve, reject)
            }
                
        });
        
    }
    catch(e) {
        console.log("   " + colors.red(e.message)+ "\n");
        return reject(e);
    } 
}

// Main :
module.exports = (platform, settingFile) => {

    return new Promise((resolve, reject)=>{
        if(!Boolean(settingFile)) {
            console.log("\n   " + colors.bold(colors.red("error")) + " " + "invalid setting file address!" + "\n");
            reject(new Error("invalid setting file address!"));
        }
        
        const { projectBase, settingFilePath, androidParams, iosParams, workspacePath, schemePath } = initialize(settingFile, reject);

        const iosValueGen = valueGenFunc(iosParams);
        const androidValueGen = valueGenFunc(androidParams);

        switch (platform) {
            case "android":
                fs.mkdirSync(buildPathResolver("android"), { recursive: true });
                buildAndroid(androidValueGen, projectBase, settingFilePath, resolve, reject);
                break;
            case "ios":
                fs.mkdirSync(buildPathResolver("ios"), { recursive: true });
                buildIOS(iosValueGen, projectBase, settingFilePath, workspacePath, schemePath, resolve, reject);
                break;
            case "both":
                fs.mkdirSync(buildPathResolver("android"), { recursive: true });
                buildAndroid(androidValueGen, projectBase, settingFilePath, (result) => {
                    fs.mkdirSync(buildPathResolver("ios"), { recursive: true });
                    buildIOS(iosValueGen, projectBase, settingFilePath, workspacePath, schemePath, resolve, reject);
                }, reject);
                break;

                
        }
    });
}
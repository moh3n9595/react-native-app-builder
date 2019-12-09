const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const colors = require("colors");
const boxen = require("boxen");
const { name:packageName, version:packageVersion, description:packageDescription } = require("./package.json");

const logLine = colors.gray("\n---------------------------------");
const MAX_BUFFER_SIZE = 1024 * 500 * 1024;
const ARCHIVE_NAME = "REACT_NATIVE_APP_BUILDER_ARCHIVE"; 
const buildPathResolver = (platform) => path.join(".", `/builds/${platform}`);

// Package info log :
function startLog() {
    console.log("\n" + boxen(packageName + " v" + packageVersion + "\n\n " + packageDescription, {padding: 1, borderColor: "yellow"}));
}


// read error better :
function errorBeautifier(err) {
    let errMessage = "";
    if (err && err.stack && err.message) {
        errMessage = err.message;
    }
    else {
        errMessage = err;
    }
    return "\n   " + colors.bold(colors.red("error")) + " " + errMessage.replace(/\n/g, "\n   ") + "\n";
}

function beautyLog(message, type = "warn") {
    switch(type) {
        case "warn":
            console.log("\n   " + colors.bold(colors.yellow("warn")) + " " + message);
            break;
        case "info":
            console.log("\n   " + colors.bold(colors.cyan("info")) + " " + message);
            break;
        case "success":
            console.log("\n   " + colors.bold(colors.green("success")) + " " + message);
            break;
    }
}

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
            console.log(errorBeautifier("invalid setting file!"));
            if(callback)
                callback(new Error("invalid setting file!"));
        }
        return settings;
    }
    catch(e) {
        console.log(errorBeautifier(e));
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
    const OS = osDetection();

    if(!newValues) {
        console.log(logLine);
        return resolve();
    }

    if(!Boolean(newValues.buildName)) {
        console.log(errorBeautifier("buildName key is undefined | emptyString | null | false -- (Required)"));
        return reject(new Error("buildName key is undefined | emptyString | null | false -- (Required)"));
    }

    console.log(logLine);
    beautyLog("BUILDING " + newValues.buildName + "...", "info");

    // Set variable : 
    try {
        let settingJson = require(path.join(projectBase,settingFilePath));
        settingJson = { ...settingJson, ...newValues, buildName: undefined };
        fs.writeFileSync(path.join(projectBase,settingFilePath), JSON.stringify(settingJson));

        if(OS == "Windows")
			execSync(projectBase.split(":")[0] + ":");
		
        exec(`cd ${projectBase}/android && ${OS != "Windows"?"./":""}gradlew assembleRelease`, {maxBuffer: MAX_BUFFER_SIZE}, (error, stdout, stderr)=> {
            
            if(error) {
                console.log(errorBeautifier(error));
                return reject(error);
            }

            if(stdout.includes("BUILD SUCCESSFUL")) {
                beautyLog(newValues.buildName + " FINISHED", "success");
                
                const newPath = path.join(".",`/builds/android/${newValues.buildName}.apk`);
                if (fs.existsSync(newPath)) {
                    fs.unlinkSync(newPath);
                }
                fs.renameSync(path.join(projectBase,androidBuildPath), newPath);
                
            }
    
            if(!done) {
                buildAndroid(androidValueGen, projectBase, settingFilePath, resolve, reject);
            }
                
        });
        
    }
    catch(e) {
        console.log(errorBeautifier(e));
        return reject(e);
    } 
}


// Builds for ios :
function buildIOS(iosValueGen, projectBase, settingFilePath, workspacePath, schemePath, resolve, reject) {
    if(osDetection() != "MacOS") {
        beautyLog("ios need mac operating system!", "warn");
		resolve(true);
    }
    
    const iosBuildPath = `/ios/${ARCHIVE_NAME}.xcarchive`;
    const {value:newValues, done} = iosValueGen.next();
    if(!newValues) {
        console.log(logLine);
        return resolve();
    }

    if(!Boolean(newValues.buildName)) {
        console.log(errorBeautifier("buildName key is undefined | emptyString | null | false -- (Required)"));
        return reject(new Error("buildName key is undefined | emptyString | null | false -- (Required)"));
    }

    console.log(logLine);
    beautyLog("BUILDING " + newValues.buildName + "...", "info");

    // Set variable : 
    try {
        let settingJson = require(path.join(projectBase,settingFilePath));
        settingJson = { ...settingJson, ...newValues, buildName: undefined };
        fs.writeFileSync(path.join(projectBase,settingFilePath), JSON.stringify(settingJson));

        exec(`cd ${projectBase}/ios && xcodebuild -allowProvisioningUpdates -workspace ${workspacePath}.xcworkspace -scheme \"${schemePath}\" clean archive -configuration release -sdk iphoneos -archivePath ${ARCHIVE_NAME}.xcarchive`, {maxBuffer: MAX_BUFFER_SIZE}, (error, stdout, stderr)=> {
            
            if(error) {
                console.log(errorBeautifier(e));
                return reject(error);
            }

            if(stdout.includes("ARCHIVE SUCCEEDED")) {
                beautyLog(newValues.buildName + " FINISHED", "success");
                const newPath = path.join(".",`/builds/ios/${newValues.buildName}.xcarchive`);
                if (fs.existsSync(newPath)) {
                    fs.unlinkSync(newPath);
                }
                fs.renameSync(path.join(projectBase,iosBuildPath), newPath);                
            }
    
            if(!done) {
                buildIOS(iosValueGen, projectBase, settingFilePath, workspacePath, schemePath, resolve, reject);
            }
                
        });
        
    }
    catch(e) {
        console.log(errorBeautifier(e));
        return reject(e);
    } 
}

// Main :
function main(platform, settingFile) {

    startLog();
    
    return new Promise((resolve, reject)=>{
        if(!Boolean(settingFile)) {
            console.log(errorBeautifier("invalid setting file address!"));
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
                if(osDetection() != "MacOS") {
                    console.log(errorBeautifier("ios need mac operating system!"));
                    return reject(new Error("ios need mac operating system!"));
                }
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

module.exports = main;

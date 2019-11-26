const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const colors = require("colors");


const logLine = "\n---------------------------------\n";
const MAX_BUFFER_SIZE = 1024 * 500 * 1024;
const buildPathResolver = (platform) => path.join(".", `/builds/${platform}`);

// Initialize settings :
function initialize(address) {
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
        console.log(e);
        process.exit();
    }
}

// Value generator :
function* valueGenFunc(storesArr) {
    for (let i = 0; i < storesArr.length; i++) {
        yield storesArr[i];
    }
}


// Builds for android :
function buildAndroid(androidValueGen, projectBase, settingFilePath) {

    const androidBuildPath = "/android/app/build/outputs/apk/release/app-release.apk";
    const {value:newValues, done} = androidValueGen.next();
    
    if(!newValues) {
        console.log(logLine);
        process.exit();
    }

    if(!Boolean(newValues.buildName)) {
        console.log("\n   " + colors.bold(colors.red("error")) + " " + "buildName key is undefined | emptyString | null | false -- (Required)" + "\n");
        process.exit();
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
                process.exit();
            }

            if(stdout.includes("BUILD SUCCESSFUL")) {
                console.log("\n   " + colors.bold(colors.green("success")) + " " + newValues.buildName + " FINISHED");
                fs.renameSync(path.join(projectBase,androidBuildPath), path.join(".",`/builds/android/${newValues.buildName}.apk`));
            }
    
            if(!done) {
                buildAndroid(androidValueGen, projectBase, settingFilePath)
            }
                
        });
        
    }
    catch(e) {
        console.log("   " + colors.red(e.message)+ "\n");
    } 
}

// Builds for ios :
function buildIOS(iosValueGen, projectBase, settingFilePath, workspacePath, schemePath, archiveName) {

    const iosBuildPath = `/ios/${archiveName}.xcarchive`;
    const {value:newValues, done} = iosValueGen.next();
    
    if(!newValues) {
        console.log(logLine);
        process.exit();
    }

    if(!Boolean(newValues.buildName)) {
        console.log("\n   " + colors.bold(colors.red("error")) + " " + "buildName key is undefined | emptyString | null | false -- (Required)" + "\n");
        process.exit();
    }

    console.log(logLine);
    console.log("   " + colors.bold(colors.cyan("info")) + " BUILDING " + newValues.buildName + "...");

    // Set variable : 
    try {
        let settingJson = require(path.join(projectBase,settingFilePath));
        settingJson = { ...newValues, buildName: undefined,  ...settingJson };
        fs.writeFileSync(path.join(projectBase,settingFilePath), JSON.stringify(settingJson));

        exec(`cd ${projectBase}/ios && xcodebuild -allowProvisioningUpdates -workspace ${workspacePath}.xcworkspace -scheme \"${schemePath}\" clean archive -configuration release -sdk iphoneos -archivePath ${archiveName}.xcarchive`, {maxBuffer: MAX_BUFFER_SIZE}, (error, stdout, stderr)=> {
            
            if(error) {
                console.log(error);
                process.exit();
            }

            if(stdout.includes("ARCHIVE SUCCEEDED")) {
                console.log("\n   " + colors.bold(colors.green("success")) + " " + newValues.buildName + " FINISHED");
                fs.renameSync(path.join(projectBase,iosBuildPath), path.join(".",`/builds/ios/${newValues.buildName}.xcarchive`));
            }
    
            if(!done) {
                buildIOS(iosValueGen, projectBase, settingFilePath, workspacePath, schemePath, archiveName)
            }
                
        });
        
    }
    catch(e) {
        console.log("   " + colors.red(e.message)+ "\n");
    } 
}

// Main :
module.exports = (platform, settingFile) => {

    if(!Boolean(settingFile)) {
        console.log("\n   " + colors.bold(colors.red("error")) + " " + "invalid setting file address!" + "\n");
        process.exit();
    }
    
    const { projectBase, settingFilePath, androidParams, iosParams, workspacePath, schemePath, archiveName } = initialize(settingFile);
    
    switch (platform) {
        case "android":
            fs.mkdirSync(buildPathResolver("android"), { recursive: true });
            const androidValueGen = valueGenFunc(androidParams);
            buildAndroid(androidValueGen, projectBase, settingFilePath);
            break;
        case "ios":
            fs.mkdirSync(buildPathResolver("ios"), { recursive: true });
            const iosValueGen = valueGenFunc(iosParams);
            buildIOS(iosValueGen, projectBase, settingFilePath, workspacePath, schemePath, archiveName);
            break;
    }
    
}
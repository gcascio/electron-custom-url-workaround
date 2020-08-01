const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chdir } = require('process');

const extractDir = 'squashfs-root';
const appImageTool = 'appimagetool';
const appImageToolDownloadURL =
  'https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage';

/**
 * Append %URL parameter to Exec of desktop file.
 *
 * @param desktopFileDir path to desktop file directory
 */
const passURLToDesktopFile = (desktopFileDir) => {
  const desktopFileName = fs.readdirSync(desktopFileDir).find((file) => file.match(/.*\.desktop$/));

  // Read original desktop file
  const desktopFile = fs.readFileSync(path.join(desktopFileDir, desktopFileName), 'utf8');

  // Append %U to Exec
  const patchedDesktopFile = desktopFile.replace(/^Exec.*$/m, (match) => `${match} %U`);

  // Overwrite old desktop file with patched file
  fs.writeFileSync(path.join(desktopFileDir, desktopFileName), patchedDesktopFile);
};

/**
 * Pack AppDir to AppImage.
 *
 * @param appImageSourceDir //path of AppImage source
 * @param appImageOutputPath //path of AppImage output
 */
const packAppImage = (appImageSourceDir, appImageOutputPath) => {
  // Download appImageTool
  execSync(
    `
      curl \
      --fail \
      --location \
      --output ${appImageTool} \
      ${appImageToolDownloadURL}
    `,
  );

  // Make appImageTool executable
  execSync(`chmod +x ${appImageTool}`);

  // Pack AppImage source directory to AppImage
  execSync(`
    ./${appImageTool} \
    -n \
    --comp \
    xz \
    ${appImageSourceDir} \
    ${appImageOutputPath}
  `);
};

exports.default = (context) => {
  const appimageArtifact = context.artifactPaths.find((artifact) => artifact.endsWith('AppImage'));

  if (!appimageArtifact) {
    return;
  }

  const originalDir = process.cwd();
  chdir(context.outDir);

  // Extract original AppImage
  execSync(`${appimageArtifact} --appimage-extract`);

  // Patch desktop file
  passURLToDesktopFile(extractDir);

  // Delete original AppImage
  execSync(`rm ${appimageArtifact}`);

  // Repack extracted and patched AppImage
  packAppImage(extractDir, appimageArtifact);

  chdir(originalDir);
};

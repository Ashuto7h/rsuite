const fs = require('fs');
const path = require('path');

// Path to the directory to scan
const componentsDir = path.join(__dirname, '../src');
// Path to the file where the generated content will be written
const outputFile = path.join(__dirname, '../src/CustomProvider/types.ts');

// List of directories to exclude
const excludeDirs = ['CustomProvider', 'Schema', 'DOMHelper'];

// Components that require scanning their subcomponents
const specialComponents = ['Progress', 'Placeholder', 'Animation'];

// Check if a directory name starts with an uppercase letter and is not in the exclude list
function isUpperCaseDirectory(dirPath) {
  const dirName = path.basename(dirPath);
  return /^[A-Z]/.test(dirName) && !excludeDirs.includes(dirName);
}

// Get subcomponents for special cases like Progress, Placeholder, and Animation, assuming they are files
function getSubcomponents(dir, component) {
  return fs
    .readdirSync(path.join(dir, component))
    .filter(file => {
      const filePath = path.join(dir, component, file);
      return fs.statSync(filePath).isFile() && /^[A-Z]/.test(file.replace(/\.[jt]sx?$/, ''));
    })
    .map(file => file.replace(/\.[jt]sx?$/, ''))
    .filter(file => {
      const dirName = path.basename(file);
      return !specialComponents.includes(dirName);
    });
}

// Get all top-level directories that start with an uppercase letter and are not in the exclude list
function getComponents(dir) {
  return fs.readdirSync(dir).filter(file => {
    const filePath = path.join(dir, file);

    return fs.statSync(filePath).isDirectory() && isUpperCaseDirectory(filePath);
  });
}

// Generate the import statements with `import type` and the ReactSuiteComponents interface content
function generateComponentList(components, specialComponents) {
  let imports = '';
  let interfaceBody = '';

  components.forEach(component => {
    if (specialComponents.includes(component)) {
      console.log('component', component);
      // Handle special cases like Progress, Placeholder, Animation with subcomponent files
      const subcomponents = getSubcomponents(componentsDir, component);
      if (subcomponents.length > 0) {
        // Only generate subcomponent imports if found, skip the parent component
        subcomponents.forEach(subcomponent => {
          const propsName = `${subcomponent}Props`;
          imports += `import type { ${propsName} } from '../${component}/${subcomponent}';\n`;
          interfaceBody += `  ${subcomponent}: ComponentProps<${propsName}>;\n`;
        });
      }
    } else {
      // Handle regular components if no subcomponents exist
      const propsName = `${component}Props`;
      imports += `import type { ${propsName} } from '../${component}';\n`;
      interfaceBody += `  ${component}: ComponentProps<${propsName}>;\n`;
    }
  });

  return `
// This file is automatically generated by a script. Do not edit it manually.
${imports}
interface ComponentProps<T> {
  defaultProps: Partial<T>;
}

export interface ReactSuiteComponents {
${interfaceBody}}
  `;
}

// Get the list of components and generate the content
const components = getComponents(componentsDir);
const fileContent = generateComponentList(components, specialComponents);

// Write the generated content to the target file
fs.writeFileSync(outputFile, fileContent.trim());

console.log('ReactSuiteComponents.ts has been generated!');
